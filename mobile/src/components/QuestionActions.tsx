import React, { createContext, useContext, useEffect, useRef } from 'react';

export type StickyAction = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

type SetAction = React.Dispatch<React.SetStateAction<StickyAction | null>>;

const StickyContext = createContext<SetAction | null>(null);

/**
 * Lets an exercise publish its primary action (usually "Check") to the player,
 * so the button can live in a footer pinned to the bottom of the screen
 * instead of scrolling away with a long question.
 */
export function StickyActionProvider({
  setAction,
  children,
}: {
  setAction: SetAction;
  children: React.ReactNode;
}) {
  return <StickyContext.Provider value={setAction}>{children}</StickyContext.Provider>;
}

export function useStickyAction(action: StickyAction | null) {
  const setAction = useContext(StickyContext);
  const latest = useRef(action);
  latest.current = action;

  const active = !!action && !!setAction;
  const label = action?.label ?? '';
  const disabled = !!action?.disabled;

  useEffect(() => {
    if (!setAction) return;
    if (!active) {
      setAction(null);
      return;
    }
    setAction({ label, disabled, onPress: () => latest.current?.onPress() });
    return () => setAction(null);
  }, [setAction, active, label, disabled]);
}
