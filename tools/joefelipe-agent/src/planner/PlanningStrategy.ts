import type { Goal, PlannedMission } from "./types.ts"

export interface PlanningStrategy {
  readonly name: string
  plan(goal: Goal): PlannedMission[] | Promise<PlannedMission[]>
}