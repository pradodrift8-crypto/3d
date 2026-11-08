import React from "react";
import { Composition } from "remotion";
import { AlexShort } from "./videos/alejandro/Alex";
import { TOTAL, FPS } from "./videos/alejandro/story";
import { ArenaShort } from "./videos/arena/Arena";
import { TOTAL as ARENA_TOTAL } from "./videos/arena/story";
// Registra cada short nuevo aquí, con su propio id.
export const Root: React.FC = () => (
  <>
    <Composition id="Alejandro" component={AlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="Arena" component={ArenaShort} durationInFrames={ARENA_TOTAL} fps={30} width={1080} height={1920} />
  </>
);
