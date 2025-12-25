"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function main() {
    const password = process.argv[2];
    if (!password) {
        console.error('Usage: pnpm -C apps/backend hash:password "your-password"');
        process.exit(1);
    }
    const hash = await bcryptjs_1.default.hash(password, 10);
    console.log(hash);
}
void main();
//# sourceMappingURL=hash-password.js.map