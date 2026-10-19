/**
 * [INPUT]: 依赖Cavalry脚本API的创建、连接、选择、播放和类型读取能力。
 * [OUTPUT]: 创建固定Rectangle与Sound节点，连接并选择Sound，播放后输出实际类型。
 * [POS]: 可复用Sound空File输入脚本；不赋File、不保存Scene、不证明通知通过。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const rectangle = api.primitive('rectangle', 'Sound Notification Rectangle');
const sound = api.create('sound', 'Sound Missing Audio');

api.connect(sound, 'id', rectangle, 'generator.dimensions.x');
api.select([sound]);
api.play();

console.log(
    'SOUND_EMPTY_FILE_TYPES|rectangle=' + api.getLayerType(rectangle)
    + '|sound=' + api.getLayerType(sound)
);
