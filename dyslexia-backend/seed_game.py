from __future__ import annotations

"""
Seed the 90-day structured literacy Game Mode curriculum.

This module is imported by the /api/game/seed endpoint.
It is designed to be idempotent: if day 1 exists, seeding should be skipped
by the API layer.
"""

from dataclasses import dataclass
from typing import Any
import random

from sqlalchemy.orm import Session as DBSession

from app.models.game_day import GameDay
from app.models.game_exercise import GameExercise


def phase_for_day(day_number: int) -> int:
    if 1 <= day_number <= 7:
        return 1
    if 8 <= day_number <= 21:
        return 2
    if 22 <= day_number <= 35:
        return 3
    if 36 <= day_number <= 49:
        return 4
    if 50 <= day_number <= 63:
        return 5
    if 64 <= day_number <= 90:
        return 6
    raise ValueError("day_number out of range")


def phase_title(phase: int) -> str:
    return {
        1: "Phonological Awareness",
        2: "Phonics & Decoding",
        3: "Fluency & Syllable Types",
        4: "Vocabulary & Morphology",
        5: "Syntax & Spelling Rules",
        6: "Reading Comprehension",
    }[phase]


PHASE_TYPES: dict[int, list[str]] = {
    1: ["syllable_tap", "rhyme_match", "sound_identify", "sound_blend"],
    2: ["letter_sound_match", "word_builder", "odd_one_out", "decode_word"],
    3: ["syllable_split", "syllable_sort", "timed_flash_read", "speed_sort"],
    4: ["morpheme_builder", "definition_match", "word_family_sort", "fill_blank"],
    5: ["spelling_rule_sort", "sentence_unscramble", "spell_it", "error_detect"],
    6: ["passage_mcq", "sequence_events", "inference_question", "main_idea_picker"],
}


WORD_BANK = {
    # Phase 1
    "p1_simple": ["cat", "sun", "hat", "dog", "run", "top", "map", "fish", "tree", "moon"],
    "p1_multi": ["basket", "banana", "elephant", "computer", "tomato", "holiday", "butterfly", "animal"],
    # Phase 2 (CVC + blends)
    "p2_cvc": ["cat", "map", "pin", "hop", "run", "sit", "fin", "cap", "bed", "mud"],
    "p2_blends": ["stop", "flag", "clip", "grab", "spin", "track", "plant", "crisp", "blend", "smile"],
    # Phase 3 (syllable types examples)
    "p3_words": ["robot", "music", "paper", "sunset", "invite", "repeat", "home", "ice", "kite", "rain"],
    # Phase 4 (morphology/vocab)
    "prefixes": ["un", "re", "pre", "dis", "mis"],
    "suffixes": ["ing", "ed", "er", "ful", "less"],
    "roots": ["play", "help", "kind", "move", "read", "write", "act"],
    "vocab": [
        ("curious", "wanting to know more"),
        ("brave", "not afraid to try"),
        ("careful", "doing something safely"),
        ("tiny", "very small"),
        ("enormous", "very big"),
        ("predict", "guess what will happen"),
        ("collect", "gather things together"),
    ],
    # Phase 5 (rules/syntax)
    "rule_ck": ["duck", "truck", "clock", "back", "stick", "pack"],
    "rule_k": ["bike", "take", "like", "spoke", "bake", "joke"],
    "sentences": [
        "the dog ran fast",
        "my friend is kind",
        "we play in the park",
        "i like to read books",
        "the cat sits on the mat",
    ],
    "misspell_pairs": [
        ("friend", "freind"),
        ("because", "becuase"),
        ("weather", "wether"),
        ("write", "rite"),
        ("school", "scool"),
    ],
    # Phase 6 (passages)
    "passage_topics": ["a lost puppy", "a rainy day", "a school trip", "planting seeds", "a new game"],
}


def _rng_for_day(day_number: int) -> random.Random:
    return random.Random(10_000 + day_number)


def _pick(rng: random.Random, seq: list[Any], k: int) -> list[Any]:
    if k >= len(seq):
        return list(seq)
    return rng.sample(seq, k)


def _syllable_count(word: str) -> int:
    # Lightweight heuristic good enough for gameplay checks.
    vowels = "aeiouy"
    w = word.lower().strip()
    if not w:
        return 1
    count = 0
    prev_vowel = False
    for ch in w:
        is_v = ch in vowels
        if is_v and not prev_vowel:
            count += 1
        prev_vowel = is_v
    if w.endswith("e") and count > 1:
        count -= 1
    return max(1, count)


def build_day_exercises(day_number: int) -> list[tuple[str, dict[str, Any]]]:
    phase = phase_for_day(day_number)
    rng = _rng_for_day(day_number)

    if phase == 1:
        # Rotate difficulty: mix simple and multi-syllable.
        words = _pick(rng, WORD_BANK["p1_simple"], 3) + _pick(rng, WORD_BANK["p1_multi"], 2)
        rhyme_pairs = [("cat", "hat"), ("dog", "log"), ("sun", "run")]
        # Slightly vary pairs by day
        if day_number % 2 == 0:
            rhyme_pairs = [("top", "mop"), ("map", "cap"), ("tree", "bee")]
        sound_word = rng.choice(WORD_BANK["p1_simple"])
        position = "first" if day_number % 2 == 1 else "last"
        target_sound = sound_word[0] if position == "first" else sound_word[-1]
        blend = rng.choice(["sun", "cat", "map", "run", "hat", "dog"])
        phonemes = list(blend)  # simple phoneme proxy for seed; frontend TTS speaks letters

        return [
            ("syllable_tap", {"prompt": "Tap once for each syllable.", "words": words, "answer": {w: _syllable_count(w) for w in words}}),
            ("rhyme_match", {"prompt": "Match the words that rhyme.", "pairs": rhyme_pairs}),
            ("sound_identify", {"prompt": f"Tap the letter for the {position} sound in the word.", "word": sound_word, "position": position, "answer": target_sound}),
            ("sound_blend", {"prompt": "Listen to the sounds. Pick the word.", "phonemes": phonemes, "options": rng.sample(["sun", "cat", "map", "run", "hat", "dog"], 4), "answer": blend}),
        ]

    if phase == 2:
        letter = rng.choice(list("abcdefghijklmnopqrstuvwxyz"))
        sounds = [f"/{letter}/", f"/{rng.choice('aeiou')}/", f"/{rng.choice('ptkbdgmns')}/", f"/{rng.choice('lr')}/"]
        word = rng.choice(WORD_BANK["p2_cvc"])
        tiles = list(word)
        rng.shuffle(tiles)
        rule = "CVC words"
        odd_words = _pick(rng, WORD_BANK["p2_cvc"], 3) + [rng.choice(WORD_BANK["p2_blends"])]
        rng.shuffle(odd_words)
        odd_answer = next(w for w in odd_words if w in WORD_BANK["p2_blends"])
        decode = rng.choice(WORD_BANK["p2_blends"])
        options = rng.sample(WORD_BANK["p2_blends"], 3) + [decode]
        rng.shuffle(options)

        return [
            ("letter_sound_match", {"prompt": "Pick the sound for the letter.", "letter": letter, "options": sounds, "answer": f"/{letter}/"}),
            ("word_builder", {"prompt": "Build the word by dragging the letters.", "tiles": tiles, "answer": word}),
            ("odd_one_out", {"prompt": f"Which word breaks the rule: {rule}?", "options": odd_words, "answer": odd_answer}),
            ("decode_word", {"prompt": "Choose the correct word you hear.", "word": decode, "options": options, "answer": decode}),
        ]

    if phase == 3:
        w = rng.choice(["robot", "music", "paper", "sunset", "invite", "repeat"])
        # Syllable boundary index: naive split near middle for seed
        boundary = max(1, min(len(w) - 2, len(w) // 2))
        sort_bins = ["closed", "open", "vce", "vowel_team"]
        sort_words = _pick(rng, ["cat", "me", "kite", "rain", "hot", "go", "cake", "team"], 6)
        # Provide intended bins (rough, for seed)
        bin_map = {}
        for sw in sort_words:
            if sw in ("me", "go"):
                bin_map[sw] = "open"
            elif sw in ("kite", "cake"):
                bin_map[sw] = "vce"
            elif sw in ("rain", "team"):
                bin_map[sw] = "vowel_team"
            else:
                bin_map[sw] = "closed"
        flash_words = _pick(rng, ["rapid", "steady", "silent", "bright", "gentle", "quick"], 4)
        meanings = {fw: f"A simple meaning of {fw}." for fw in flash_words}
        speed_groups = {"short_a": ["cat", "map", "cap"], "long_a": ["cake", "late", "game"]}

        return [
            ("syllable_split", {"prompt": "Tap where the word should split into syllables.", "word": w, "answer": boundary}),
            ("syllable_sort", {"prompt": "Sort words into syllable types.", "bins": sort_bins, "words": sort_words, "answer": bin_map}),
            ("timed_flash_read", {"prompt": "A word will flash. Tap its meaning.", "words": flash_words, "meanings": meanings, "answer": {fw: meanings[fw] for fw in flash_words}, "timer_optional": True}),
            ("speed_sort", {"prompt": "Sort words into the right group.", "groups": speed_groups, "answer": speed_groups, "timer_optional": True}),
        ]

    if phase == 4:
        root = rng.choice(WORD_BANK["roots"])
        prefix = rng.choice(WORD_BANK["prefixes"])
        suffix = rng.choice(WORD_BANK["suffixes"])
        built = f"{prefix}{root}{suffix}"
        vocab = rng.sample(WORD_BANK["vocab"], 4)
        options = [w for w, _d in vocab]
        defs = [d for _w, d in vocab]
        pairs = list(zip(options, defs))
        rng.shuffle(pairs)
        family_root = rng.choice(["act", "move", "read"])
        family_words = [family_root, f"{family_root}ing", f"{family_root}ed", f"re{family_root}"]
        sentence = "I will ____ the book tonight."
        blank_options = ["read", "reading", "reads", "reader"]
        blank_answer = "read"

        return [
            ("morpheme_builder", {"prompt": "Build a new word using a prefix/suffix.", "root": root, "prefixes": WORD_BANK["prefixes"], "suffixes": WORD_BANK["suffixes"], "answer": built}),
            ("definition_match", {"prompt": "Match each word to its meaning.", "pairs": pairs, "answer": {w: d for w, d in pairs}}),
            ("word_family_sort", {"prompt": "Group words that share the same root.", "root": family_root, "words": family_words, "answer": family_words}),
            ("fill_blank", {"prompt": sentence, "options": blank_options, "answer": blank_answer}),
        ]

    if phase == 5:
        rule_bins = ["-ck", "-k"]
        ck_words = _pick(rng, WORD_BANK["rule_ck"], 3)
        k_words = _pick(rng, WORD_BANK["rule_k"], 3)
        sort_words = ck_words + k_words
        rng.shuffle(sort_words)
        answer = {w: ("-ck" if w in WORD_BANK["rule_ck"] else "-k") for w in sort_words}
        sent = rng.choice(WORD_BANK["sentences"])
        tiles = sent.split()
        rng.shuffle(tiles)
        spell_word, misspell = rng.choice(WORD_BANK["misspell_pairs"])
        err_sentence = f"I will {misspell} you later."
        spell_prompt = spell_word
        keyboard = list("abcdefghijklmnopqrstuvwxyz")

        return [
            ("spelling_rule_sort", {"prompt": "Sort each word into the right spelling rule.", "bins": rule_bins, "words": sort_words, "answer": answer}),
            ("sentence_unscramble", {"prompt": "Put the words in order to make a sentence.", "tiles": tiles, "answer": sent}),
            ("spell_it", {"prompt": "Listen and type the word.", "tts_text": spell_prompt, "keyboard": keyboard, "answer": spell_prompt}),
            ("error_detect", {"prompt": "Tap the misspelled word.", "sentence": err_sentence, "answer": misspell}),
        ]

    # phase 6
    topic = rng.choice(WORD_BANK["passage_topics"])
    passage = f"Today was about {topic}. It was a simple story with a clear beginning, middle, and end."
    q = "What is the passage mostly about?"
    options = [topic, "a big storm", "a lost coin", "a new teacher"]
    rng.shuffle(options)
    events = ["First we got ready.", "Next we went outside.", "Then we helped each other.", "Finally we went home."]
    shuffled = events[:]
    rng.shuffle(shuffled)
    infer_q = "Why did they help each other?"
    infer_opts = ["They wanted to be kind.", "They were bored.", "They were angry.", "They forgot."]
    main_idea_opts = [
        "It tells a short story with simple events.",
        "It explains how to bake a cake.",
        "It lists many different animals.",
        "It is about a spaceship.",
    ]

    return [
        ("passage_mcq", {"passage": passage, "question": q, "options": options, "answer": topic}),
        ("sequence_events", {"prompt": "Put the events in the correct order.", "tiles": shuffled, "answer": events}),
        ("inference_question", {"passage": passage, "question": infer_q, "options": infer_opts, "answer": "They wanted to be kind."}),
        ("main_idea_picker", {"passage": passage, "options": main_idea_opts, "answer": main_idea_opts[0]}),
    ]


def seed_all_days(db: DBSession) -> int:
    created = 0
    for day_number in range(1, 91):
        phase = phase_for_day(day_number)
        title = f"Day {day_number}: {phase_title(phase)}"
        game_day = GameDay(day_number=day_number, phase_number=phase, title=title)
        db.add(game_day)
        db.flush()  # get game_day.id

        exercises = build_day_exercises(day_number)
        if len(exercises) != 4:
            raise RuntimeError(f"Expected 4 exercises for day {day_number}, got {len(exercises)}")

        for idx, (exercise_type, content) in enumerate(exercises, start=1):
            db.add(
                GameExercise(
                    game_day_id=game_day.id,
                    order_in_day=idx,
                    exercise_type=exercise_type,
                    content=content,
                )
            )

        created += 1
        if day_number % 10 == 0:
            db.flush()

    db.commit()
    return created

