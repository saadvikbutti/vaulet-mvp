import { useCallback, useEffect, useState } from "react";

export function useLoad(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const data = await loader();
      setState({ data, loading: false, error: "" });
      return data;
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message || "Could not load this information." }));
      return null;
    }
  // Dependencies are supplied by the caller to refresh when route IDs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => { refresh(); }, [refresh]);
  return { ...state, refresh, setData: (data) => setState({ data, loading: false, error: "" }) };
}
