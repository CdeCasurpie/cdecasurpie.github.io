import DataManager from "../core/DataManager.js";

export class TestSection {
    constructor() {
        this.personal = DataManager.getPersonal();
        this.socialLinks = DataManager.getSocial();
    }


    render() {
        return `
            <section class="ui-layer" id="projects">
                <h1>Test Section</h1>
            </setcion>
        `;
    }

    mount() {
    }
}