import { User } from '@coinweb/contract-kit';

const plainSortOBject = (objectValue: object): object =>
  Object.fromEntries(
    Object.entries(objectValue).sort(([keyA], [keyB]) => {
      if (keyA < keyB) {
        return -1;
      }

      if (keyA > keyB) {
        return 1;
      }

      return 0;
    }),
  );

const stableStringify = (objectValue: object): string => {
  return JSON.stringify(objectValue, (_, value) => {
    if (typeof value === 'object' && value !== null) {
      return plainSortOBject(value);
    }

    return value;
  });
};

export const isEqualUser = (userA: User, userB: User) => stableStringify(userA) === stableStringify(userB);
