export function buildPaintTimesObject(paintTimes) {
  return {
    firstPaint: getTimeFromMarks(paintTimes, 'first-paint'),
    firstContentfulPaint: getTimeFromMarks(
      paintTimes,
      'first-contentful-paint'
    ),
  };
}

export function getTimeFromMarks(marks, name) {
  const thisMark = marks.find(mark => mark.name === name);
  return thisMark && thisMark.startTime;
}
