"""Fine-tune TrOCR-large on prepared handwriting line crops."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from transformers import (
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    TrOCRProcessor,
    VisionEncoderDecoderModel,
)

from app.evaluation.metrics import character_error_rate, word_error_rate
from app.training.manifest import ensure_validation_split, load_prepared_line_manifest
from app.training.trocr_dataset import TrOCRDataCollator, TrOCRLineDataset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tune TrOCR-large on local handwriting data.")
    parser.add_argument("--manifest", required=True, help="Path to a prepared line-level manifest JSONL file.")
    parser.add_argument("--output-dir", required=True, help="Directory where checkpoints and logs will be saved.")
    parser.add_argument("--model-name", default="microsoft/trocr-large-handwritten", help="Base TrOCR checkpoint.")
    parser.add_argument("--epochs", type=float, default=5.0, help="Number of fine-tuning epochs.")
    parser.add_argument("--train-batch-size", type=int, default=1, help="Per-device training batch size.")
    parser.add_argument("--eval-batch-size", type=int, default=1, help="Per-device evaluation batch size.")
    parser.add_argument("--learning-rate", type=float, default=3e-5, help="Learning rate.")
    parser.add_argument("--warmup-steps", type=int, default=50, help="Warmup steps.")
    parser.add_argument("--gradient-accumulation-steps", type=int, default=4, help="Gradient accumulation steps.")
    parser.add_argument("--max-target-length", type=int, default=128, help="Maximum target token length.")
    parser.add_argument("--num-beams", type=int, default=4, help="Beam size for generation during evaluation.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--validation-ratio", type=float, default=0.1, help="Used only if no validation split exists.")
    parser.add_argument("--use-cpu", action="store_true", help="Force CPU training for compatibility.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        import accelerate  # noqa: F401
    except ImportError as exc:  # pragma: no cover - runtime environment dependent
        raise SystemExit(
            "Training requires the 'accelerate' package. Install backend requirements again after pulling the update."
        ) from exc

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    samples = ensure_validation_split(
        load_prepared_line_manifest(args.manifest),
        validation_ratio=args.validation_ratio,
        seed=args.seed,
    )
    train_samples = [sample for sample in samples if sample.split == "train"]
    validation_samples = [sample for sample in samples if sample.split == "validation"]
    if not train_samples:
        raise SystemExit("Prepared manifest does not contain any train samples.")
    if not validation_samples:
        raise SystemExit("Prepared manifest does not contain any validation samples.")

    processor = TrOCRProcessor.from_pretrained(args.model_name)
    model = VisionEncoderDecoderModel.from_pretrained(args.model_name)
    model.config.decoder_start_token_id = processor.tokenizer.cls_token_id
    model.config.pad_token_id = processor.tokenizer.pad_token_id
    model.config.eos_token_id = processor.tokenizer.sep_token_id
    model.config.max_length = args.max_target_length
    model.config.num_beams = args.num_beams
    model.config.early_stopping = True

    train_dataset = TrOCRLineDataset(train_samples, processor, max_target_length=args.max_target_length)
    eval_dataset = TrOCRLineDataset(validation_samples, processor, max_target_length=args.max_target_length)
    collator = TrOCRDataCollator()

    def compute_metrics(prediction_output) -> dict[str, float]:
        predictions = prediction_output.predictions
        labels = prediction_output.label_ids
        if isinstance(predictions, tuple):
            predictions = predictions[0]

        label_ids = np.where(labels != -100, labels, processor.tokenizer.pad_token_id)
        pred_texts = processor.batch_decode(predictions, skip_special_tokens=True)
        label_texts = processor.batch_decode(label_ids, skip_special_tokens=True)

        cer_scores = [character_error_rate(label, pred) for label, pred in zip(label_texts, pred_texts)]
        wer_scores = [word_error_rate(label, pred) for label, pred in zip(label_texts, pred_texts)]
        return {
            "cer": float(sum(cer_scores) / max(1, len(cer_scores))),
            "wer": float(sum(wer_scores) / max(1, len(wer_scores))),
        }

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(output_dir),
        do_train=True,
        do_eval=True,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="cer",
        greater_is_better=False,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        learning_rate=args.learning_rate,
        warmup_steps=args.warmup_steps,
        num_train_epochs=args.epochs,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        predict_with_generate=True,
        generation_max_length=args.max_target_length,
        generation_num_beams=args.num_beams,
        logging_steps=10,
        save_total_limit=2,
        report_to="none",
        seed=args.seed,
        use_cpu=args.use_cpu,
        remove_unused_columns=False,
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        data_collator=collator,
        processing_class=processor,
        compute_metrics=compute_metrics,
    )
    trainer.train()
    trainer.save_model(str(output_dir / "best_model"))
    processor.save_pretrained(str(output_dir / "best_model"))
    metrics = trainer.evaluate()
    print("Final evaluation metrics:", metrics)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
