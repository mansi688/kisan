import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/**
 * A password <input> with a real show/hide toggle — not a decorative icon.
 * - Defaults hidden (type="password"); toggling flips to type="text" and back.
 * - The toggle is a <button type="button">, so it can never submit the
 *   surrounding <form> (a plain clickable icon/span would be worse here:
 *   it wouldn't be keyboard-focusable or announced as a control at all).
 * - aria-label and aria-pressed describe the CURRENT action and state to
 *   screen readers ("Show password" / "Hide password").
 * - The value itself is never touched — only the input's `type` changes,
 *   so toggling never loses or alters what the person typed.
 * Drop-in replacement for <input type="password" .../> — pass every other
 * prop straight through (value, onChange, required, autoComplete, etc).
 */
export default function PasswordInput({ id, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        {...props}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={() => setVisible(v => !v)}
        tabIndex={0}
      >
        {visible ? <EyeOffIcon width={17} height={17} /> : <EyeIcon width={17} height={17} />}
      </button>
    </div>
  );
}
