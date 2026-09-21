type CellState = "normal" | "merged" | "new";
type CellObject = {
  state: CellState;
  value: number
};
export type Cell = CellObject | null;
export type Map2048 = Cell[][];
export type Direction = "up" | "left" | "right" | "down";
type RotateDegree = 0 | 90 | 180 | 270;
type DirectionDegreeMap = Record<Direction, RotateDegree>;
type MoveResult = { result: Map2048; isMoved: boolean, score: number };
export type NewCell = { x: number; y: number; value: number };

/**
 * 2048 게임에서, Map을 특정 방향으로 이동했을 때 결과를 반환하는 함수입니다.
 * @param map 2048 맵. 빈 공간은 null 입니다.
 * @param direction 이동 방향
 * @returns 이동 방향에 따른 결과와 이동되었는지 여부
 */
export const moveMapIn2048Rule = (
  map: Map2048,
  direction: Direction,
): MoveResult => {
  if (!validateMapIsNByM(map)) throw new Error("Map is not N by M");

  const rotatedMap = rotateMapCounterClockwise(map, rotateDegreeMap[direction]);

  const { result, isMoved, score } = moveLeft(rotatedMap);

  return {
    result: rotateMapCounterClockwise(result, revertDegreeMap[direction]),
    isMoved,
    score
  };
};

const validateMapIsNByM = (map: Map2048) => {
  const firstColumnCount = map[0].length;
  return map.every((row) => row.length === firstColumnCount);
};

const rotateMapCounterClockwise = (
  map: Map2048,
  degree: 0 | 90 | 180 | 270,
): Map2048 => {
  const rowLength = map.length;
  const columnLength = map[0].length;

  switch (degree) {
    case 0:
      return map;
    case 90:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowIndex][columnLength - columnIndex - 1],
        ),
      );
    case 180:
      return Array.from({ length: rowLength }, (_, rowIndex) =>
        Array.from(
          { length: columnLength },
          (_, columnIndex) =>
            map[rowLength - rowIndex - 1][columnLength - columnIndex - 1],
        ),
      );
    case 270:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowLength - rowIndex - 1][columnIndex],
        ),
      );
  }
};

const moveLeft = (map: Map2048): MoveResult => {
  const movedRows = map.map(moveRowLeft);
  const result = movedRows.map((movedRow) => movedRow.result);
  const isMoved = movedRows.some((movedRow) => movedRow.isMoved);
  const score = movedRows.reduce(
    (acc, movedRow) => acc + movedRow.score,
    0
  );
  return { result, isMoved, score };
};

const moveRowLeft = (row: Cell[]): { result: Cell[]; isMoved: boolean, score: number } => {
  const reduced = row.reduce(
    (acc: { lastCell: Cell; result: Cell[], score: number }, cell) => {
      if (cell === null) {
        return acc;
      }
      if (acc.lastCell === null) {
        return { ...acc, lastCell: cell };
      }
      if (acc.lastCell.value === cell.value) {
        const mergedCell: Cell = {
          state: 'merged',
          value: cell.value * 2,
        };
        return { result: [...acc.result, mergedCell], lastCell: null, score: acc.score + mergedCell.value };
      } else {
        const normalCell: Cell = { ...acc.lastCell, state: 'normal' };
        return { result: [...acc.result, normalCell], lastCell: cell, score: acc.score };
      }
    },
    { lastCell: null, result: [], score: 0 }
  );
  
  const finalResult: Cell[] = [...reduced.result];
  if (reduced.lastCell) {
    finalResult.push({ ...reduced.lastCell, state: 'normal' });
  }

  const resultRow = Array.from(
    { length: row.length },
    (_, i) => finalResult[i] ?? null
  );

  const isMoved = row.some(
    (originalCell, i) => originalCell?.value !== resultRow[i]?.value
  );

  return {
    result: resultRow,
    isMoved,
    score: reduced.score
  };
};

const rotateDegreeMap: DirectionDegreeMap = {
  up: 90,
  right: 180,
  down: 270,
  left: 0,
};

const revertDegreeMap: DirectionDegreeMap = {
  up: 270,
  right: 180,
  down: 90,
  left: 0,
};

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function initializeMap(): Map2048 {
  const map2048: Map2048 = Array.from(
    {length: 4},
    () => Array.from({length: 4}, () => null)
  );
  const randomInt1 = getRandomInt(16);
  map2048[Math.floor(randomInt1 / 4)][randomInt1 % 4] = {
    state: "new",
    value: 2
  };
  
  let randomInt2 = getRandomInt(16);
  while (randomInt1 === randomInt2) {
    randomInt2 = getRandomInt(16);
  }
  map2048[Math.floor(randomInt2 / 4)][randomInt2 % 4] = {
    state: "new",
    value: 2
  };

  return map2048;
}

export function addNewCell(map2048: Map2048): Map2048 {
  const randomInt1 = Math.random() < 0.6 ? 2 : 4;
  const nullPositions = [];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (map2048[i][j] === null) {
        nullPositions.push([i ,j]);
      }
    }
  }

  const randomInt2 = getRandomInt(nullPositions.length);
  const [i, j] = nullPositions[randomInt2];
  
  return map2048.with(
    i,
    map2048[i].with(
      j, {state: "new", value: randomInt1}
    )
  );
}

export function findMaxInMap(map2048: Map2048): number {
  return Math.max(
    ...map2048.map(
      (row) => {
        return Math.max(...row.map((x) => { return x ? x.value : 0; }));
      }
    )
  );
}

export function userLoses(map2048: Map2048): boolean {
  // is there any empty cell?
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (map2048[i][j] === null) {
        return false;
      }
    }
  }

  // if no empty cell, is there any mergable cells?
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const currentCell = map2048[i][j];
      if (j < 3 && currentCell === map2048[i][j + 1]) {
        return false;
      }
      if (i < 3 && currentCell === map2048[i + 1][j]) {
        return false;
      }
    }
  }

  return true;
}