import { getActiveEmblemCount } from '../bannerScore';
import type {
  ApplyOperationInput,
  ApplyOperationResult,
  EmblemColor,
  Operation,
  OperationApplier,
  Quality,
  Trait,
} from '../types';

const unimplemented: OperationApplier = (input) => ({
  status: 'applied',
  banner: input.banner,
});

function pickRandomItem<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function pickRandomHigherQuality(current: Quality): Quality {
  const options: Quality[] = [];
  for (let quality = current + 1; quality <= 5; quality += 1) {
    options.push(quality as Quality);
  }

  return pickRandomItem(options)!;
}

function getEligibleEmblemIndicesForQualityIncrease(input: ApplyOperationInput): number[] {
  const activeCount = getActiveEmblemCount(input.stage);
  const eligibleIndices: number[] = [];

  for (let emblemIndex = 0; emblemIndex < activeCount; emblemIndex += 1) {
    if (input.banner.emblems[emblemIndex].quality < 5) {
      eligibleIndices.push(emblemIndex);
    }
  }

  return eligibleIndices;
}

function applyRandomlyIncreaseOneQuality(input: ApplyOperationInput): ApplyOperationResult {
  const emblemIndex = pickRandomItem(getEligibleEmblemIndicesForQualityIncrease(input));
  if (emblemIndex === undefined) {
    return { status: 'skipped', reason: 'There are no emblems eligible to be increased' };
  }

  const nextQuality = pickRandomHigherQuality(input.banner.emblems[emblemIndex].quality);

  return {
    status: 'applied',
    banner: {
      ...input.banner,
      emblems: input.banner.emblems.map((emblem, index) =>
        index === emblemIndex ? { ...emblem, quality: nextQuality } : emblem
      ),
    },
  };
}

function pickRandomIndices(indices: number[], count: number): number[] {
  return [...indices].sort(() => Math.random() - 0.5).slice(0, count);
}

function pickRandomLowerQuality(current: Quality): Quality {
  const options: Quality[] = [];
  for (let quality = 1; quality < current; quality += 1) {
    options.push(quality as Quality);
  }

  return pickRandomItem(options)!;
}

function applyRandomlyIncreaseTwoQualitiesAndReduceOne(
  input: ApplyOperationInput
): ApplyOperationResult {
  const activeCount = getActiveEmblemCount(input.stage);
  const activeIndices = Array.from({ length: activeCount }, (_, emblemIndex) => emblemIndex);
  const qualities = input.banner.emblems.slice(0, activeCount).map((emblem) => emblem.quality);
  const tierOneCount = qualities.filter((quality) => quality === 1).length;

  const candidatesToIncrease = activeIndices.filter(
    (emblemIndex) => qualities[emblemIndex] < 5
  );

  if (candidatesToIncrease.length < 2) {
    return { status: 'skipped', reason: 'There are less than 2 emblems eligible to be increased' };
  }

  let indicesToIncrease: number[];
  //special case when there is only one emblem with quality greater than 1
  //in this case, we need to increase the quality of two emblems that are at quality 1
  //and reduce the quality of the one with quality greater than 1
  if (tierOneCount === activeCount - 1) {
    const tierOneIndices = activeIndices.filter((emblemIndex) => qualities[emblemIndex] === 1);

    indicesToIncrease = pickRandomIndices(tierOneIndices, 2);
  } else {
    indicesToIncrease = pickRandomIndices(candidatesToIncrease, 2);
  }

  const remainingIndices = activeIndices.filter(
    (emblemIndex) => !indicesToIncrease.includes(emblemIndex)
  );
  const indicesEligibleToWorsen = remainingIndices.filter(
    (emblemIndex) => input.banner.emblems[emblemIndex].quality > 1
  );

  const indexToWorsen = pickRandomItem(indicesEligibleToWorsen);

  return {
    status: 'applied',
    banner: {
      ...input.banner,
      emblems: input.banner.emblems.map((emblem, index) => {
        if (indicesToIncrease.includes(index)) {
          return { ...emblem, quality: pickRandomHigherQuality(emblem.quality) };
        }

        if (index === indexToWorsen) {
          return { ...emblem, quality: pickRandomLowerQuality(emblem.quality) };
        }

        return emblem;
      }),
    },
  };
}

function pickRandomDifferentQuality(current: Quality): Quality {
  const qualities: Quality[] = [];
  for (let quality = 1; quality <= 5; quality += 1) {
    if (quality !== current) {
      qualities.push(quality as Quality);
    }
  }

  return pickRandomItem(qualities)!;
}

const ALL_TRAITS: Trait[] = ['fractal', 'friendly', 'benevolent', 'vampiric', 'unique'];

type EmblemRerollSelection = 'all' | 'first' | 'last' | 'random';

interface EmblemRerollTarget {
  color: EmblemColor;
  selection: EmblemRerollSelection;
}

function getEmblemIndicesForReroll(
  input: ApplyOperationInput,
  { color, selection }: EmblemRerollTarget
): number[] {
  const activeCount = getActiveEmblemCount(input.stage);
  const matchingIndices: number[] = [];

  for (let emblemIndex = 0; emblemIndex < activeCount; emblemIndex += 1) {
    if (input.banner.emblems[emblemIndex].color === color) {
      matchingIndices.push(emblemIndex);
    }
  }

  if (matchingIndices.length === 0) {
    return [];
  }

  switch (selection) {
    case 'all':
      return matchingIndices;
    case 'first':
      return [matchingIndices[0]];
    case 'last':
      return [matchingIndices[matchingIndices.length - 1]];
    case 'random':
      return [pickRandomItem(matchingIndices)!];
  }
}

function pickRandomDifferentTrait(current: Trait): Trait {
  return pickRandomItem(ALL_TRAITS.filter((trait) => trait !== current))!;
}

function applyRerollQuality(
  input: ApplyOperationInput,
  target: EmblemRerollTarget
): ApplyOperationResult {
  const emblemIndices = getEmblemIndicesForReroll(input, target);
  if (emblemIndices.length === 0) {
    return {
      status: 'skipped',
      reason: `No ${target.color} emblems to reroll`,
    };
  }

  const indicesToReroll = new Set(emblemIndices);

  return {
    status: 'applied',
    banner: {
      ...input.banner,
      emblems: input.banner.emblems.map((emblem, index) =>
        indicesToReroll.has(index)
          ? { ...emblem, quality: pickRandomDifferentQuality(emblem.quality) }
          : emblem
      ),
    },
  };
}

function applyRerollTrait(
  input: ApplyOperationInput,
  target: EmblemRerollTarget
): ApplyOperationResult {
  const emblemIndices = getEmblemIndicesForReroll(input, target);
  if (emblemIndices.length === 0) {
    return {
      status: 'skipped',
      reason: `No ${target.color} emblems to reroll`,
    };
  }

  const indicesToReroll = new Set(emblemIndices);

  return {
    status: 'applied',
    banner: {
      ...input.banner,
      emblems: input.banner.emblems.map((emblem, index) =>
        indicesToReroll.has(index)
          ? { ...emblem, trait: pickRandomDifferentTrait(emblem.trait) }
          : emblem
      ),
    },
  };
}

const OPERATION_APPLIERS: Record<Operation, OperationApplier> = {
  rerollStatForGreenEmblems: unimplemented,
  rerollStatForFirstGreenEmblem: unimplemented,
  rerollStatForLastGreenEmblem: unimplemented,
  rerollStatForRandomGreenEmblem: unimplemented,
  rerollStatForRedEmblems: unimplemented,
  rerollStatForBlueEmblems: unimplemented,
  randomlyIncreaseOneQuality: applyRandomlyIncreaseOneQuality,
  randomlyIncreaseTwoQualitiesAndReduceOne: applyRandomlyIncreaseTwoQualitiesAndReduceOne,
  rerollQualityForGreenEmblems: (input) =>
    applyRerollQuality(input, { color: 'green', selection: 'all' }),
  rerollQualityForRedEmblems: (input) =>
    applyRerollQuality(input, { color: 'red', selection: 'all' }),
  rerollQualityForFirstRedEmblem: (input) =>
    applyRerollQuality(input, { color: 'red', selection: 'first' }),
  rerollQualityForLastRedEmblem: (input) =>
    applyRerollQuality(input, { color: 'red', selection: 'last' }),
  rerollQualityForRandomRedEmblem: (input) =>
    applyRerollQuality(input, { color: 'red', selection: 'random' }),
  rerollQualityForBlueEmblems: (input) =>
    applyRerollQuality(input, { color: 'blue', selection: 'all' }),
  rerollTraitForGreenEmblems: (input) =>
    applyRerollTrait(input, { color: 'green', selection: 'all' }),
  rerollTraitForRedEmblems: (input) =>
    applyRerollTrait(input, { color: 'red', selection: 'all' }),
  rerollTraitForBlueEmblems: (input) =>
    applyRerollTrait(input, { color: 'blue', selection: 'all' }),
  rerollTraitForFirstBlueEmblem: (input) =>
    applyRerollTrait(input, { color: 'blue', selection: 'first' }),
  rerollTraitForLastBlueEmblem: (input) =>
    applyRerollTrait(input, { color: 'blue', selection: 'last' }),
  rerollTraitForRandomBlueEmblem: (input) =>
    applyRerollTrait(input, { color: 'blue', selection: 'random' }),
};

export function applyOperation(input: ApplyOperationInput): ApplyOperationResult {
  return OPERATION_APPLIERS[input.operation](input);
}
