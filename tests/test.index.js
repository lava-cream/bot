import { DurationFormatter, Duration } from '@sapphire/time-utilities';

console.log({
  formatter: new DurationFormatter().format(61000, Infinity, { right: ', ' }),
  duration: new Duration('d').dateFrom(new Date(Date.now() + 62000))
});