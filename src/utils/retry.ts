export function retryUntil(action: () => Promise<any>,
                           isValidResult: (val: any) => boolean): Promise<any> {

  const innerRetry = (val: boolean) => {
    if (!isValidResult(val)) {
      return retryUntil(action, isValidResult);
    } else {
      return val;
    }
  };

  return action()
    .then(innerRetry)
    .catch(() => retryUntil(action, isValidResult));
}
