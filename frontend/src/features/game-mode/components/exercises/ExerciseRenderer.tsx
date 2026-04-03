import React from "react";
import { ExerciseProps } from "./types";
import { SyllableTapExercise } from "./impl/SyllableTapExercise";
import { RhymeMatchExercise } from "./impl/RhymeMatchExercise";
import { SoundIdentifyExercise } from "./impl/SoundIdentifyExercise";
import { SoundBlendExercise } from "./impl/SoundBlendExercise";
import { LetterSoundMatchExercise } from "./impl/LetterSoundMatchExercise";
import { WordBuilderExercise } from "./impl/WordBuilderExercise";
import { OddOneOutExercise } from "./impl/OddOneOutExercise";
import { DecodeWordExercise } from "./impl/DecodeWordExercise";
import { SyllableSplitExercise } from "./impl/SyllableSplitExercise";
import { SyllableSortExercise } from "./impl/SyllableSortExercise";
import { TimedFlashReadExercise } from "./impl/TimedFlashReadExercise";
import { SpeedSortExercise } from "./impl/SpeedSortExercise";
import { MorphemeBuilderExercise } from "./impl/MorphemeBuilderExercise";
import { DefinitionMatchExercise } from "./impl/DefinitionMatchExercise";
import { WordFamilySortExercise } from "./impl/WordFamilySortExercise";
import { FillBlankExercise } from "./impl/FillBlankExercise";
import { SpellingRuleSortExercise } from "./impl/SpellingRuleSortExercise";
import { SentenceUnscrambleExercise } from "./impl/SentenceUnscrambleExercise";
import { SpellItExercise } from "./impl/SpellItExercise";
import { ErrorDetectExercise } from "./impl/ErrorDetectExercise";
import { PassageMcqExercise } from "./impl/PassageMcqExercise";
import { SequenceEventsExercise } from "./impl/SequenceEventsExercise";
import { InferenceQuestionExercise } from "./impl/InferenceQuestionExercise";
import { MainIdeaPickerExercise } from "./impl/MainIdeaPickerExercise";

export function ExerciseRenderer(props: ExerciseProps) {
  const t = props.exercise.exercise_type;
  switch (t) {
    case "syllable_tap":
      return <SyllableTapExercise {...props} />;
    case "rhyme_match":
      return <RhymeMatchExercise {...props} />;
    case "sound_identify":
      return <SoundIdentifyExercise {...props} />;
    case "sound_blend":
      return <SoundBlendExercise {...props} />;
    case "letter_sound_match":
      return <LetterSoundMatchExercise {...props} />;
    case "word_builder":
      return <WordBuilderExercise {...props} />;
    case "odd_one_out":
      return <OddOneOutExercise {...props} />;
    case "decode_word":
      return <DecodeWordExercise {...props} />;
    case "syllable_split":
      return <SyllableSplitExercise {...props} />;
    case "syllable_sort":
      return <SyllableSortExercise {...props} />;
    case "timed_flash_read":
      return <TimedFlashReadExercise {...props} />;
    case "speed_sort":
      return <SpeedSortExercise {...props} />;
    case "morpheme_builder":
      return <MorphemeBuilderExercise {...props} />;
    case "definition_match":
      return <DefinitionMatchExercise {...props} />;
    case "word_family_sort":
      return <WordFamilySortExercise {...props} />;
    case "fill_blank":
      return <FillBlankExercise {...props} />;
    case "spelling_rule_sort":
      return <SpellingRuleSortExercise {...props} />;
    case "sentence_unscramble":
      return <SentenceUnscrambleExercise {...props} />;
    case "spell_it":
      return <SpellItExercise {...props} />;
    case "error_detect":
      return <ErrorDetectExercise {...props} />;
    case "passage_mcq":
      return <PassageMcqExercise {...props} />;
    case "sequence_events":
      return <SequenceEventsExercise {...props} />;
    case "inference_question":
      return <InferenceQuestionExercise {...props} />;
    case "main_idea_picker":
      return <MainIdeaPickerExercise {...props} />;
    default:
      return (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Unsupported exercise type</div>
          <div style={{ marginTop: 8, fontSize: 16, opacity: 0.85 }}>
            Type: <b>{t}</b>
          </div>
          <button
            className="btn primary"
            style={{ marginTop: 12, minHeight: 48, padding: "12px 16px", fontSize: 18 }}
            onClick={() => props.onSubmit(0)}
          >
            Continue
          </button>
        </div>
      );
  }
}

