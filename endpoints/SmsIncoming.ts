import {IHttp, IModify, IPersistence, IRead} from '@rocket.chat/apps-engine/definition/accessors';
import {ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse} from '@rocket.chat/apps-engine/definition/api';
import {ILivechatRoom, IVisitor} from '@rocket.chat/apps-engine/definition/livechat';
import {IUser} from '@rocket.chat/apps-engine/definition/users/IUser';
import {AppSetting} from '../config/Settings';
import {GetSettingsById} from '../lib/getSettingsById';
import {safeJsonParse} from '../lib/safeJsonParse';

export class SmsIncoming extends ApiEndpoint {
    public path = AppSetting.ENDPOINT_SMS_INCOMING;

    /**
     *
     * @param request
     * @param endpoint
     * @param read
     * @param modify
     * @param http
     * @param persis
     */
    public async post(
        request: IApiRequest,
        endpoint: IApiEndpointInfo,
        read: IRead,
        modify: IModify,
        http: IHttp, persis: IPersistence): Promise<IApiResponse> {
        const {
            messages = [
                {
                    from: '',
                    text: '',
                    owner: '',
                },
            ],
        } = safeJsonParse(request.content) || {};
        const responses = messages.map(async (message: any) => {
            const token = message.from;
            const text = message.text;
            const ownerPhone = message.owner;
            const settingsBotDepartmentIdOrName = GetSettingsById(AppSetting.DEPARTMENT);
            const settingsBotUserName = GetSettingsById(AppSetting.USER_NAME);

            const visitor = await this.createOrGetVisitor(token, read, modify, settingsBotDepartmentIdOrName?.value);

            const agent = await read.getUserReader().getByUsername(settingsBotUserName?.value);

            if (visitor && agent) {
                await modify.getUpdater().getLivechatUpdater().setCustomFields(visitor.token, 'owner_phone', ownerPhone, true);

                const rooms = await this.createOrGetRooms(visitor, agent, read, modify, settingsBotDepartmentIdOrName?.value);
                if (rooms) {
                    // rooms.department = await read.getLivechatReader().getLivechatDepartmentByIdOrName("653adb68731a21a60375d6f4")
                    const messageBuilder = modify.getCreator()
                        .startLivechatMessage()
                        .setText(text)
                        .setRoom(rooms)
                        .setVisitor(visitor);
                    await modify.getCreator().finish(messageBuilder);
                    return true;
                }

            }
            return false;
        });

        const results = await Promise.all(responses);
        if (results.includes(false)) {
            return {
                status: 500,
                content: results,
            };
        } else {
            return this.success(results);
        }

    }

    public async createOrGetVisitor(token: string, read: IRead, modify: IModify, department: string): Promise<IVisitor | undefined> {
        const getVisitor = await read.getLivechatReader().getLivechatVisitorByToken(token);

        if (getVisitor) {

            return getVisitor;
        }
        await modify.getCreator().getLivechatCreator().createVisitor({
            name: token,
            token,
            username: token,
            department,
        });

        return await read.getLivechatReader().getLivechatVisitorByToken(token);
    }

    public async createOrGetRooms(
        visitor: IVisitor,
        agent: IUser,
        read: IRead,
        modify: IModify,
        settingsBotDepartmentIdOrName: string): Promise<ILivechatRoom | undefined> {
        const getRooms = await read.getLivechatReader().getLivechatRooms(visitor);
        if (getRooms.length) {
            return getRooms[0];
        }
        visitor.department = settingsBotDepartmentIdOrName;

        return  await modify.getCreator().getLivechatCreator().createRoom(visitor, agent);
    }
}
