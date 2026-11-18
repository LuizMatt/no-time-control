import { k } from "./core/k";
import { registerBootScene } from "./scenes/boot";
import { registerStageScene } from "./scenes/stage";

registerBootScene();
registerStageScene();

k.go("boot");
