type SealProps = {
  text: string;
  className?: string;
};

export function Seal({ text, className = "" }: SealProps) {
  return (
    <span aria-hidden="true" className={`seal ${className}`}>
      {text}
    </span>
  );
}
