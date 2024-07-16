import {ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    API_KEY = 'API_KEY',
    API_URL = 'API_URL',
    APPLICATION_ID = 'APPLICATION_ID',
    USER_NAME = 'USER_NAME',
    DEPARTMENT = 'DEPARTMENT',

    ENDPOINT_SMS_INCOMING = 'sms-incoming',
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.API_KEY,
        section: 'Bandwidth_Config',
        public: true,
        type: SettingType.STRING,
        value: '',
        packageValue: '',
        hidden: false,
        i18nLabel: 'API_KEY_LABEL',
        i18nDescription: 'API_KEY_DESCRIPTION',
        required: true,
    },
    {
        id: AppSetting.API_URL,
        section: 'Bandwidth_Config',
        public: true,
        type: SettingType.STRING,
        value: '',
        packageValue: '',
        hidden: false,
        i18nLabel: 'API_URL_LABEL',
        i18nDescription: 'API_URL_DESCRIPTION',
        required: true,
    },
    {
        id: AppSetting.APPLICATION_ID,
        section: 'Bandwidth_Config',
        public: true,
        type: SettingType.STRING,
        value: '',
        packageValue: '',
        hidden: false,
        i18nLabel: 'APPLICATION_ID_LABEL',
        i18nDescription: 'APPLICATION_ID_DESCRIPTION',
        required: true,
    },
    {
        id: AppSetting.USER_NAME,
        section: 'Bandwidth_App_Config',
        public: true,
        type: SettingType.STRING,
        value: '',
        packageValue: '',
        hidden: false,
        i18nLabel: 'USER_NAME_LABEL',
        i18nDescription: 'USER_NAME_DESCRIPTION',
        required: true,
    },
    {
        id: AppSetting.DEPARTMENT,
        section: 'Bandwidth_App_Config',
        public: true,
        type: SettingType.STRING,
        value: '',
        packageValue: '',
        hidden: false,
        i18nLabel: 'DEPARTMENT_LABEL',
        i18nDescription: 'DEPARTMENT_DESCRIPTION',
        required: false,
    },
]
