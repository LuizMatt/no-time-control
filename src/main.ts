import { k } from "./core/k";
import { registerBootScene } from "./scenes/boot";
import { registerEndingScene } from "./scenes/ending";
import { registerIntroScene } from "./scenes/intro";
import { registerStageScene } from "./scenes/stage";

registerBootScene();
registerIntroScene();
registerStageScene();
registerEndingScene();

k.go("boot");
