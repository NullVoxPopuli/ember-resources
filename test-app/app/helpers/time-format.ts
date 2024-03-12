const locale = 'en-US';
const formatter = new Intl.DateTimeFormat(locale, {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

export default function timeFormat(input: string) {
  return formatter.format(input);
}
