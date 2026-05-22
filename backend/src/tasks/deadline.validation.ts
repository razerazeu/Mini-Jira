import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

const US_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})/;

export const normalizeDeadline = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const match = US_DATE_REGEX.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
};

export function IsTodayOrFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTodayOrFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          const deadlineDate = getDateOnly(value);
          if (!deadlineDate) {
            return false;
          }

          return deadlineDate >= getTodayDateOnly();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot be set in the past`;
        },
      },
    });
  };
}

function getDateOnly(value: string) {
  const isoDatePrefix = ISO_DATE_PREFIX_REGEX.exec(value);
  if (isoDatePrefix) {
    return isoDatePrefix[1];
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function getTodayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}
