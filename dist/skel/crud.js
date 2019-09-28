var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
mmmm/crud_select_tttt

Select function for table tttt

Arguments:
    

Example:
    

Returns:

*/
const crud_select_tttt = (args, extras) => __awaiter(this, void 0, void 0, function* () {
    try {
        const field = args[0];
        const oper = args[1];
        const value = args[2];
        const sql = `ssss`;
        const reply = yield db.sql(sql, [group_id]);
        return [false, reply.rows];
    }
    catch (error) {
        return [true, null, error.message];
    }
});
