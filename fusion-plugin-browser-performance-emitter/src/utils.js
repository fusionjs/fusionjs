/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type PaintTime = {
  entryType: string,
  name: string,
  startTime: number,
  duration: number,
};

export function buildPaintTimesObject(paintTimes: Array<PaintTime>) {
  return {
    firstPaint: getTimeFromMarks(paintTimes, 'first-paint'),
    firstContentfulPaint: getTimeFromMarks(
      paintTimes,
      'first-contentful-paint'
    ),
  };
}

export function getTimeFromMarks(marks: Array<PaintTime>, name: string) {
  const matchingMarks = marks.filter(mark => mark.name === name);
  return matchingMarks.length ? matchingMarks[0].startTime : null;
}
