/** Copyright (c) 2018 Uber Technologies, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type paintTimesType = Array<{[string]: string}>;

export function buildPaintTimesObject(paintTimes: paintTimesType) {
  return {
    firstPaint: getTimeFromMarks(paintTimes, 'first-paint'),
    firstContentfulPaint: getTimeFromMarks(
      paintTimes,
      'first-contentful-paint'
    ),
  };
}

export function getTimeFromMarks(marks: paintTimesType, name: string) {
  const thisMark = marks.find(mark => mark.name === name);
  return thisMark && thisMark.startTime;
}
