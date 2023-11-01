import {
    IHttp,
    IConfigurationExtend,
    IPersistence,
    IRead, IConfigurationModify, IEnvironmentRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IMessage} from '@rocket.chat/apps-engine/definition/messages';
import {IPreMessageSentPrevent} from '@rocket.chat/apps-engine/definition/messages/IPreMessageSentPrevent';
import {ApiSecurity, ApiVisibility} from '@rocket.chat/apps-engine/definition/api';
import {SmsIncoming} from './endpoints/SmsIncoming';
import {AppSetting, settings} from "./config/Settings";
import {GetSettingsById} from "./lib/getSettingsById";
import {ISetting} from "@rocket.chat/apps-engine/definition/settings";


export class BandwidthApp extends App implements IPreMessageSentPrevent {


    /**
     *
     * @private
     */
    private async subscribe() {
        const endpointSmsIncoming = this.getAccessors().providedApiEndpoints.find((item) => item.path === AppSetting.ENDPOINT_SMS_INCOMING)
        const rootUrl = await this.getAccessors().reader.getEnvironmentReader().getEnvironmentVariables().getValueByName('ROOT_URL')
        const apiKey = GetSettingsById(AppSetting.API_KEY)?.value
        const apiUrl = GetSettingsById(AppSetting.API_URL)?.value
        const applicationId = GetSettingsById(AppSetting.APPLICATION_ID)?.value
        try {
            await this.getAccessors().http.post(apiUrl + '/subscribe', {
                data: {
                    application_id: applicationId,
                    url: rootUrl + endpointSmsIncoming?.computedPath
                },
                headers: {
                    "x-api-key": apiKey
                }
            })
        } catch (e) {
            console.log(e)
        }
    }

    /**
     *
     * @private
     */
    private async unsubscribe() {
        const apiKey = GetSettingsById(AppSetting.API_KEY)?.value
        const apiUrl = GetSettingsById(AppSetting.API_URL)?.value
        const applicationId = GetSettingsById(AppSetting.APPLICATION_ID)?.value
        const endpointSmsIncoming = this.getAccessors().providedApiEndpoints.find((item) => item.path === AppSetting.ENDPOINT_SMS_INCOMING)
        const rootUrl = await this.getAccessors().reader.getEnvironmentReader().getEnvironmentVariables().getValueByName('ROOT_URL')

        try {
            await this.getAccessors().http.del(apiUrl + `/subscribe?application_id=${applicationId}&url=${rootUrl + endpointSmsIncoming?.computedPath}`, {
                data: {},
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            })
        } catch (e) {
            console.error(e)
        }
    }

    /**
     *
     * @param configuration
     */
    public async extendConfiguration(configuration: IConfigurationExtend) {
        await configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new SmsIncoming(this),
            ],
        });
        // Providing persistant app settings
        await Promise.all(
            settings.map((setting) =>
                configuration.settings.provideSetting(setting)
            )
        );
    }

    /**
     *
     * @param setting
     * @param configurationModify
     * @param read
     * @param http
     */
    public async onSettingUpdated(
        setting: ISetting,
        configurationModify: IConfigurationModify,
        read: IRead,
        http: IHttp
    ): Promise<void> {
        try {
            await this.unsubscribe()
        } catch (e) {
            console.error(e)
        }
        try {
            await this.subscribe()
        } catch (e) {
            console.error(e)
        }

        return super.onSettingUpdated(setting, configurationModify, read, http);
    }


    /**
     *
     * @param environment
     * @param configurationModify
     */
    public async onEnable(
        environment: IEnvironmentRead,
        configurationModify: IConfigurationModify,
    ): Promise<boolean> {
        await this.subscribe()

        return super.onEnable(environment, configurationModify);

    }


    public async onDisable(
        configurationModify: IConfigurationModify
    ): Promise<void> {
        await this.unsubscribe()


        return super.onDisable(configurationModify);
    }


    /**
     *
     * @param message
     * @param read
     * @param http
     * @param persistence
     */
    async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {

        // @ts-ignore
        if (message.room.displayName && message._ROOM.source.alias == this.getInfo().name) {
            // @ts-ignore
            if (message.sender.id !== message._ROOM.visitor.id && typeof message._ROOM?._unmappedProperties_?.closer === "undefined") {
                const apiKey = GetSettingsById(AppSetting.API_KEY)?.value
                const apiUrl = GetSettingsById(AppSetting.API_URL)?.value
                const applicationId = GetSettingsById(AppSetting.APPLICATION_ID)?.value
                const Number = GetSettingsById(AppSetting.NUMBER)?.value
                // @ts-ignore
                const to = message._ROOM.visitor.token
                const response = await http.post(apiUrl + '/send-sms', {
                    data: {
                        application_id: applicationId,
                        from: Number,
                        to: to,
                        text: message.text,
                    },
                    headers: {
                        "x-api-key": apiKey
                    }
                })
                return !(response.statusCode >= 200 && response.statusCode <= 300)
            }
        }

        return false
    }
}
