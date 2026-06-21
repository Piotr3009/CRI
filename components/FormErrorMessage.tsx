/** Inline field-level validation message. Renders nothing when no error. */
export function FormErrorMessage({
  message,
  id,
}: {
  message?: string | string[];
  id?: string;
}) {
  if (!message) return null;
  const text = Array.isArray(message) ? message[0] : message;
  if (!text) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-cri-amber-dark" role="alert">
      {text}
    </p>
  );
}
