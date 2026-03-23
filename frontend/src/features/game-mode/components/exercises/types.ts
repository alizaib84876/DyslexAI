export type GameExercise = {
  id: number;
  order_in_day: number;
  exercise_type: string;
  content: any;
};

export type ExerciseSubmit = (score01: number) => void;

export type ExerciseProps = {
  exercise: GameExercise;
  onSubmit: ExerciseSubmit;
};

