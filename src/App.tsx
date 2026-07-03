import { useEffect, useState } from "react";
// subpath import on purpose: the npcts main barrel pulls the viewers module,
// which imports react-leaflet without declaring it (upstream PR candidate)
import { SpatialProvider, SpatialWorld } from "npcts/spatial";
import { configClient, commandClient, imageClient } from "./services";

export function App() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <SpatialProvider
      configClient={configClient}
      commandClient={commandClient}
      imageClient={imageClient}
      initialRoom="the-town-centre"
      width={size.w}
      height={size.h}
    >
      <SpatialWorld width={size.w} height={size.h} showMinimap={true} showKeyLegend={true} />
    </SpatialProvider>
  );
}
