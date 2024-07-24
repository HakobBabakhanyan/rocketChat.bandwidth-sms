import {
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiSecurity, ApiVisibility} from '@rocket.chat/apps-engine/definition/api';
import {App} from '@rocket.chat/apps-engine/definition/App';
import {IMessage} from '@rocket.chat/apps-engine/definition/messages';
import {IPreMessageSentPrevent} from '@rocket.chat/apps-engine/definition/messages/IPreMessageSentPrevent';
import {ISetting} from '@rocket.chat/apps-engine/definition/settings';
import {AppSetting, settings} from './config/Settings';
import {SmsIncoming} from './endpoints/SmsIncoming';
import {GetSettingsById} from './lib/getSettingsById';

export class BandwidthApp extends App implements IPreMessageSentPrevent {
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
                configuration.settings.provideSetting(setting),
            ));
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
        http: IHttp,
    ): Promise<void> {
        try {
            await this.unsubscribe();
        } catch (e) {
            console.error(e);
        }
        try {
            await this.subscribe();
        } catch (e) {
            console.error(e);
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
        await this.subscribe();

        return super.onEnable(environment, configurationModify);

    }

    public async onDisable(
        configurationModify: IConfigurationModify,
    ): Promise<void> {
        await this.unsubscribe();

        return super.onDisable(configurationModify);
    }

    /**
     *
     * @param message
     * @param read
     * @param http
     * @param persistence
     */
    public async executePreMessageSentPrevent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence): Promise<boolean> {
        // @ts-ignore
        if (message.room.displayName && this.getInfo().name === message.room?.source?.alias) {
            // @ts-ignore
            if (message.sender.id !== message.room.visitor.id && typeof message.room?._unmappedProperties_?.closer === 'undefined') {
                const apiKey = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.API_KEY);
                const apiUrl = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.API_URL);
                const applicationId = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.APPLICATION_ID);
                // @ts-ignore
                // tslint:disable-next-line:variable-name
                const Number = message.room.visitor.livechatData?.owner_phone;
                // @ts-ignore
                const to = message.room.visitor.token;
                const response = await http.post(apiUrl + '/send-sms', {
                    data: {
                        application_id: applicationId,
                        from: Number,
                        to,
                        text: message.text,
                    },
                    headers: {
                        'x-api-key': apiKey,
                    },
                });
                return !(response.statusCode >= 200 && response.statusCode <= 300);
            }
        }

        return false;
    }

    /**
     *
     * @private
     */
    private async subscribe() {
        const endpointSmsIncoming = this.getAccessors().providedApiEndpoints.find((item) => item.path === AppSetting.ENDPOINT_SMS_INCOMING);
        const rootUrl = await this.getAccessors().reader.getEnvironmentReader().getEnvironmentVariables().getValueByName('ROOT_URL');
        const apiKey = await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.API_KEY);
        const apiUrl = await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.API_URL);
        const applicationId = await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.APPLICATION_ID);
        try {
            await this.getAccessors().http.post(apiUrl + '/subscribe', {
                data: {
                    application_id: applicationId,
                    url: rootUrl + endpointSmsIncoming?.computedPath,
                },
                headers: {
                    'x-api-key': apiKey,
                },
            });
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @private
     */
    private async unsubscribe() {
        const apiKey = await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.API_KEY);
        const apiUrl =  await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.API_URL);
        const applicationId = await this.getAccessors().reader.getEnvironmentReader().getSettings().getValueById(AppSetting.APPLICATION_ID);
        const endpointSmsIncoming = this.getAccessors().providedApiEndpoints.find((item) => item.path === AppSetting.ENDPOINT_SMS_INCOMING);
        const rootUrl = await this.getAccessors().reader.getEnvironmentReader().getEnvironmentVariables().getValueByName('ROOT_URL');

        try {
            await this.getAccessors().http.del(apiUrl + `/subscribe?application_id=${applicationId}&url=${rootUrl + endpointSmsIncoming?.computedPath}`, {
                data: {},
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
        } catch (e) {
            console.error(e);
        }
    }
}
