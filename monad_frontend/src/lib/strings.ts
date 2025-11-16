export const shorten = (value: string, head = 6, tail = 4) => {
  if (value.length <= head + tail) {
    return value;
  }
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
};
