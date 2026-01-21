import { useEffect } from "react";

import { initMirrorBridge } from "../mirror/mirrorBridgeClient";
import { useAppDispatch } from "../redux/hooks";

export function useReduxMirrorSync() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    initMirrorBridge(dispatch);
  }, [dispatch]);
}
