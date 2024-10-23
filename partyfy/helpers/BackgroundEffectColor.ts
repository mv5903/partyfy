export default class BackgroundEffectColor {
    static defaultColor = 'random()';

    static setBackgroundEffectColor(hue: number) {
        document.documentElement.style.setProperty('--dot-hue', hue.toString());
    }

    static removeBackgroundEffectColor() {
        document.documentElement.style.setProperty('--dot-hue', BackgroundEffectColor.defaultColor);
    }
}