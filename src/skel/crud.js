/**
mmmm/crud_select_tttt

Select function for table tttt

Arguments:
    

Example:
    

Returns:

*/
const crud_select_tttt = async (args, extras) => {

    try {

        const field = args[0];
        const oper  = args[1];
        const value = args[2];


        const sql = `ssss`;

        const reply = await db.sql(sql, [group_id]);
        
        return [false, reply.rows];
    
    } catch(error) {

        return [true, null, error.message];

    }

};