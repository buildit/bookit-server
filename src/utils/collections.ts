

export const maybeApply = (array?: any[], mapper?: (item: any) => any) => {
  if (array) {
    if (mapper) {
      return array.map(mapper);
    }

    return array;
  }

  return [];
};

