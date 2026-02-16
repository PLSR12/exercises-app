export type TrainingContext = 'A' | 'B' | 'C'

export interface Exercise {
  name: string
  reps: number | null
  series: number | null
  weightActual: number | null
  weightBefore: number | null
  observations: string
}

export interface TrainingForm {
  trains: Exercise[]
}
