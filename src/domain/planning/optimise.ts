import { parts, type CompetitionPart, type Discipline, type CategoryPlan } from './model';

const EXACT_DISCIPLINE_LIMIT = 12;
const SEARCH_NODE_BUDGET = 100_000;
const GREEDY_START_LIMIT = 6;
const IMPROVEMENT_PASS_LIMIT = 8;
type Weights = readonly (readonly number[])[];
type Score = readonly [conflicts: number, imbalance: number];
interface Candidate {
  assignment: number[];
  score: Score;
}

function sharedRegistrationWeights(disciplines: readonly Discipline[]): Weights {
  const memberships = disciplines.map(
    (discipline) => new Set(discipline.members.map((member) => member.id)),
  );
  return memberships.map((members, index) =>
    memberships.map((other, otherIndex) =>
      index === otherIndex ? 0 : [...members].filter((id) => other.has(id)).length,
    ),
  );
}
function scoreAssignment(assignment: readonly number[], weights: Weights): Score {
  let conflicts = 0;
  const counts = [0, 0, 0];
  assignment.forEach((part, index) => {
    counts[part]++;
    for (let previous = 0; previous < index; previous++) {
      if (assignment[previous] === part) conflicts += weights[index][previous];
    }
  });
  return [conflicts, counts.reduce((sum, count) => sum + count * count, 0)];
}
function isBetter(candidate: Score, previous: Score): boolean {
  return candidate[0] < previous[0] || (candidate[0] === previous[0] && candidate[1] < previous[1]);
}
function placementCost(
  weights: Weights,
  assignment: readonly number[],
  index: number,
  part: number,
): number {
  return weights[index].reduce(
    (sum, weight, other) => sum + (assignment[other] === part ? weight : 0),
    0,
  );
}
function improveLocally(
  assignment: number[],
  order: readonly number[],
  weights: Weights,
): Candidate {
  let score = scoreAssignment(assignment, weights);
  for (let pass = 0; pass < IMPROVEMENT_PASS_LIMIT; pass++) {
    let changed = false;
    for (const index of order) {
      for (const part of parts) {
        const previous = assignment[index];
        assignment[index] = part;
        const candidate = scoreAssignment(assignment, weights);
        if (isBetter(candidate, score)) {
          score = candidate;
          changed = true;
        } else assignment[index] = previous;
      }
    }
    if (!changed) break;
  }
  return { assignment: [...assignment], score };
}
function greedyProposal(order: readonly number[], weights: Weights): Candidate {
  let best: Candidate = { assignment: [], score: [Infinity, Infinity] };
  for (let seed = 0; seed < Math.min(order.length, GREEDY_START_LIMIT); seed++) {
    const assignment = Array<number>(order.length).fill(-1);
    const counts = [0, 0, 0];
    const rotatedOrder = [...order.slice(seed), ...order.slice(0, seed)];
    for (const index of rotatedOrder) {
      const candidates = parts.map((part) => ({
        part,
        cost: placementCost(weights, assignment, index, part),
      }));
      candidates.sort(
        (a, b) => a.cost - b.cost || counts[a.part] - counts[b.part] || a.part - b.part,
      );
      const chosen = candidates[0].part;
      assignment[index] = chosen;
      counts[chosen]++;
    }
    const improved = improveLocally(assignment, order, weights);
    if (isBetter(improved.score, best.score)) best = improved;
  }
  return best;
}
function boundedExactSearch(order: readonly number[], weights: Weights, initial: Candidate) {
  let best = initial;
  let nodes = 0;
  let interrupted = false;
  const assignment = Array<number>(order.length).fill(-1);
  function search(depth: number, maxPart: number, cost: number): void {
    if (++nodes > SEARCH_NODE_BUDGET) {
      interrupted = true;
      return;
    }
    if (cost > best.score[0]) return;
    if (depth === order.length) {
      const score = scoreAssignment(assignment, weights);
      if (isBetter(score, best.score)) best = { assignment: [...assignment], score };
      return;
    }
    const index = order[depth];
    // Parts are interchangeable during search: introduce each label only once.
    for (let part = 0; part <= Math.min(2, maxPart + 1); part++) {
      const extra = placementCost(weights, assignment, index, part);
      assignment[index] = part;
      search(depth + 1, Math.max(maxPart, part), cost + extra);
      assignment[index] = -1;
      if (interrupted) return;
    }
  }
  search(0, -1, 0);
  return { best, complete: !interrupted };
}
/** Minimise shared-registration pairs first, then balance discipline counts.
 * Fixed search limits keep proposals deterministic and bound synchronous work.
 * A zero conflict score proves the primary minimum even when search is incomplete.
 */
export function optimise(disciplines: readonly Discipline[]): CategoryPlan {
  if (!disciplines.length)
    return {
      assignments: new Map(),
      search: { primaryOptimality: 'proven', completion: 'complete', score: 0 },
      manual: false,
    };
  const weights = sharedRegistrationWeights(disciplines);
  const degrees = weights.map((row) => row.reduce((sum, weight) => sum + weight, 0));
  const order = disciplines
    .map((_, index) => index)
    .sort((a, b) => degrees[b] - degrees[a] || a - b);
  const initial = greedyProposal(order, weights);
  const useExactSearch = disciplines.length <= EXACT_DISCIPLINE_LIMIT;
  const { best, complete } = useExactSearch
    ? boundedExactSearch(order, weights, initial)
    : { best: initial, complete: false };
  return {
    assignments: new Map(
      disciplines.map((discipline, index) => [
        discipline.name,
        best.assignment[index] as CompetitionPart,
      ]),
    ),
    search: {
      primaryOptimality: complete || best.score[0] === 0 ? 'proven' : 'unproven',
      completion: complete ? 'complete' : useExactSearch ? 'budget-exhausted' : 'heuristic',
      score: best.score[0],
    },
    manual: false,
  };
}
