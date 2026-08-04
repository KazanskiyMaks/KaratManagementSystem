using KaratManagementSystem.Server.Models;

namespace KaratManagementSystem.Server.Responses
{
    public class ServingTableResponse : BaseResponse
    {
        public ServingTableResponse() { }
        public ServingTableResponse(string message) : base(message) { }
        public ServingTableResponse(ServingTable servingTable)
        {
            ServingTable = servingTable;
        }

        public ServingTable? ServingTable { get; set; } = new();
    }
}
