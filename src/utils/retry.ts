function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retryUntil(action: () => Promise<any>,
                           isValidResult: (val: any) => boolean): Promise<any> {

  const innerRetry = (val: boolean) => {
    if (!isValidResult(val)) {
      return retryUntil(action, isValidResult);
    } else {
      return val;
    }
  };

  return action().then(innerRetry)
                 .catch(() => retryUntil(action, isValidResult));
}


export async function retryUntilAtInterval(interval: number,
                                           action: () => Promise<any>,
                                           isValidResult: (val: any) => boolean): Promise<any> {
  let result = await action();

  while (!isValidResult(result)) {
    await sleep(interval);
    result = await action();
  }

  return result;
}

