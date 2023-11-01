import {settings} from "../config/Settings";

/**
 *
 * @param settingsId
 * @constructor
 */
export const GetSettingsById = (settingsId: string) => {
    try {
        return  settings.find(item => {
            if (item.id === settingsId) {
                return item
            }
            return
        })
    } catch {
        return undefined;
    }
};
