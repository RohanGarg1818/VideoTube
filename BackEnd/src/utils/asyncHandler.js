const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=>next(err))
    }
}
 
export default asyncHandler

// const asyncHandler=(fn)=>async()=>{
//     try{
//         await fn(req,resizeBy,next)
//     } catch(error){
//         resizeBy.status(error.code||500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }