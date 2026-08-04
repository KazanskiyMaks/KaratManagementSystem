using KaratManagementSystem.Server.Models;
using KaratManagementSystem.Server.Requests;
using KaratManagementSystem.Server.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KaratManagementSystem.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CookOrderController(DbApp dbApp) : ControllerBase
    {
        private readonly DbApp _dbContext = dbApp;

        [HttpGet]
        public IEnumerable<CookOrder> GetCookOrders()
        {
            return _dbContext.CookOrders
                .Include(co => co.Table)
                .Include(co => co.CookOrderItems)
                .ThenInclude(oi => oi.CookItem);
        }

        [HttpGet("date/{date}")]
        public IEnumerable<CookOrder> GetCookOrdersByDate(DateTime date, [FromQuery] bool? isProcessing, [FromQuery] bool? isCompleted)
        {
            return _dbContext.CookOrders
                .Include(co => co.Table)
                .Include(co => co.CookOrderItems).ThenInclude(oi => oi.CookItem)
                .Where(co => 
                    co.CreatedAt.Date == date.Date
                    && (!isProcessing.HasValue || co.IsProcessing == isProcessing.Value)
                    && (!isCompleted.HasValue || co.IsCompleted == isCompleted.Value))
                .OrderByDescending(co => co.CreatedAt);
        }
        [HttpGet("date/near/{date}")]
        public DateTime GetNearOrdersDate(DateTime date, [FromQuery] int direction)
        {
            CookOrder? order;
            var result = DateTime.UtcNow;
            switch (direction)
            {
                case 0:
                    order = _dbContext.CookOrders
                        .FirstOrDefault(co => co.CreatedAt < date);
                    if (order == null) break;
                    result = order.CreatedAt;
                    break;
                case 1:
                    order = _dbContext.CookOrders
                        .FirstOrDefault(co => co.CreatedAt > date);
                    if (order == null) break;
                    result = order.CreatedAt;
                    break;
            }
            return result;
        }

        [HttpGet("{id}")]
        public CookOrderResponse GetCookOrder(int id)
        {
            var cookOrder = _dbContext.CookOrders
                .Include(co => co.Table)
                .Include(co => co.CookOrderItems).ThenInclude(oi => oi.CookItem)
                .FirstOrDefault(co => co.Id == id);
            if (cookOrder == null)
            {
                return new CookOrderResponse("Cook order not found");
            }

            return new CookOrderResponse
            {
                CookOrder = cookOrder
            };
        }

        [HttpPost]
        public CookOrderResponse CreateCookOrder([FromBody] NewCookOrderRequest request)
        {
            var servingTable = _dbContext.ServingTables.FirstOrDefault(st => st.Id == request.ServingTable.Id);
            if (servingTable == null)
            {
                return new CookOrderResponse("Serving table not found");
            }

            var cookOrder = new CookOrder
            {
                Table = servingTable,
                Notes = request.Notes
            };

            _dbContext.CookOrders.Add(cookOrder);
            _dbContext.SaveChanges();

            foreach (var item in request.CookItems)
            {
                _dbContext.CookOrderItems.Add(new CookOrderItem
                {
                    CookOrderId = cookOrder.Id,
                    CookItemId = item.CookItemId,
                    Quantity = item.Quantity
                });
            }
            _dbContext.SaveChanges();
            _dbContext.Entry(cookOrder).Collection(o => o.CookOrderItems).Load();
            foreach (var oi in cookOrder.CookOrderItems)
                _dbContext.Entry(oi).Reference(x => x.CookItem).Load();

            return new CookOrderResponse
            {
                CookOrder = cookOrder
            };
        }

        [HttpPatch("{id}/start_process")]
        public CookOrderResponse StartCookOrderProcess(int id)
        {
            var cookOrder = _dbContext.CookOrders
                .Include(co => co.Table)
                .Include(co => co.CookOrderItems)
                .ThenInclude(coi => coi.CookItem)
                .FirstOrDefault(co => co.Id == id);
            if (cookOrder == null)
            {
                return new CookOrderResponse("Cook order not found");
            }

            cookOrder.IsProcessing = !cookOrder.IsProcessing;
            cookOrder.StartedAt = DateTime.UtcNow;
            try
            {
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                return new CookOrderResponse(ex.Message);
            }
            return new CookOrderResponse
            {
                CookOrder = cookOrder
            };
        }

        [HttpPatch("{id}/complete_process")]
        public CookOrderResponse CompleteCookOrder(int id)
        {
            var cookOrder = _dbContext.CookOrders
                .Include(co => co.Table)
                .Include(co => co.CookOrderItems)
                .ThenInclude(coi => coi.CookItem)
                .FirstOrDefault(co => co.Id == id);
            if (cookOrder == null)
            {
                return new CookOrderResponse("Cook order not found");
            }

            cookOrder.IsCompleted = true;
            cookOrder.CompletedAt = DateTime.UtcNow;
            try
            {
                _dbContext.SaveChanges();
            }
            catch (Exception ex)
            {
                return new CookOrderResponse(ex.Message);
            }
            return new CookOrderResponse
            {
                CookOrder = cookOrder
            };
        }

        [HttpPatch("{id}/check_cook_order_item")]
        public CookOrderResponse CheckCookOrderItem(int id)
        {
            var cookOrderItem = _dbContext.CookOrderItems
                .Include(coi => coi.CookItem)
                .FirstOrDefault(coi => coi.Id == id);
            
            if (cookOrderItem == null)
            {
                return new CookOrderResponse("Cook order item not found");
            }

            cookOrderItem.IsReady = !cookOrderItem.IsReady;
            
            try
            {
                _dbContext.Entry(cookOrderItem).State = EntityState.Modified;
                _dbContext.SaveChanges();
                
                var cookOrder = _dbContext.CookOrders
                    .Include(co => co.Table)
                    .Include(co => co.CookOrderItems)
                    .ThenInclude(coi => coi.CookItem)
                    .FirstOrDefault(co => co.Id == cookOrderItem.CookOrderId);
                
                return new CookOrderResponse
                {
                    CookOrder = cookOrder
                };
            }
            catch (Exception ex)
            {
                return new CookOrderResponse(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public CookOrderResponse ChangeCookOrder(int id, [FromBody] ChangeCookOrderRequest request)
        {
            var cookOrder = _dbContext.CookOrders.FirstOrDefault(co => co.Id == id);
            if (cookOrder == null)
            {
                return new CookOrderResponse("Cook order not found");
            }

            var servingTable = _dbContext.ServingTables.FirstOrDefault(st => st.Id == request.ServingTable.Id);
            if (servingTable == null)
            {
                return new CookOrderResponse("Serving table not found");
            }

            cookOrder.Table = servingTable;

            var existingItems = _dbContext.CookOrderItems.Where(oi => oi.CookOrderId == id).ToList();
            _dbContext.CookOrderItems.RemoveRange(existingItems);

            foreach (var item in request.CookItems)
            {
                _dbContext.CookOrderItems.Add(new Models.CookOrderItem
                {
                    CookOrderId = cookOrder.Id,
                    CookItemId = item.CookItemId,
                    Quantity = item.Quantity
                });
            }

            try
            {
                _dbContext.SaveChanges();
                _dbContext.Entry(cookOrder).Collection(o => o.CookOrderItems).Load();
                foreach (var oi in cookOrder.CookOrderItems)
                    _dbContext.Entry(oi).Reference(x => x.CookItem).Load();
            }
            catch (Exception ex)
            {
                return new CookOrderResponse(ex.Message);
            }

            return new CookOrderResponse
            {
                CookOrder = cookOrder
            };
        }
    }
}
