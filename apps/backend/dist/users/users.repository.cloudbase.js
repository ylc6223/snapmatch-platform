"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseUsersRepository = void 0;
class CloudBaseUsersRepository {
    constructor(config) {
        this.config = config;
        void this.config;
    }
    async findByAccount() {
        throw new Error("CloudBaseUsersRepository is not implemented yet");
    }
}
exports.CloudBaseUsersRepository = CloudBaseUsersRepository;
//# sourceMappingURL=users.repository.cloudbase.js.map