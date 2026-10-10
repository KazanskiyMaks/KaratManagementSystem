using KaratManagementSystem.Server.Models;
using KaratManagementSystem.Server.Requests;
using KaratManagementSystem.Server.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KaratManagementSystem.Server.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class CookListController(DbApp dbApp) : ControllerBase
    {
        private readonly DbApp _dbContext = dbApp;

        #region Serving Tables

        [HttpGet("serving_tables")]
        public IEnumerable<ServingTable> GetServingTables()
        {
            return _dbContext.ServingTables;
        }

        [HttpGet("serving_table/{id}")]
        public ServingTableResponse GetServingTable(int id)
        {
            var table = _dbContext.ServingTables.FirstOrDefault(t => t.Id == id);
            if (table == null)
            {
                return new("Table not found");
            }

            return new(table);
        }

        [HttpPost("serving_table")]
        public ServingTableResponse AddServingTable(AddServingTableRequest request)
        {
            if (_dbContext.ServingTables.Any(table => table.Name == request.TableName))
            {
                return new("This name is already used");
            }
            
            var newTable = new ServingTable()
            {
                Name = request.TableName,
            };
            _dbContext.ServingTables.Add(newTable);
            _dbContext.SaveChanges();

            return new(newTable);
        }

        [HttpPut("serving_table/{id}")]
        public ServingTableResponse UpdateServingTable(int id, UpdateServingTableRequest request)
        {
            var table = _dbContext.ServingTables.FirstOrDefault(t => t.Id == id);
            if (table == null)
            {
                return new("Table not found");
            }

            if (_dbContext.ServingTables.Any(t => t.Name == request.TableName && t.Id != id))
            {
                return new("This name is already used");
            }

            table.Name = request.TableName;
            _dbContext.SaveChanges();

            return new(table);
        }

        [HttpDelete("serving_table/{id}")]
        public BaseResponse DeleteServingTable(int id)
        {
            var table = _dbContext.ServingTables.FirstOrDefault(t => t.Id == id);
            if (table == null)
            {
                return new("Table not found");
            }
            _dbContext.ServingTables.Remove(table);
            _dbContext.SaveChanges();
            return new();
        }

        #endregion

        #region Cook Items

        [HttpGet("cook_items")]
        public IEnumerable<CookItem> GetCookItems()
        {
            return _dbContext.CookItems;
        }

        [HttpPost("cook_item")]
        public CookItemResponse AddCookItem(AddCookItemRequest request)
        {
            if (_dbContext.CookItems.Any(item => item.Name == request.ItemName))
            {
                return new("This name is already used");
            }
            var newItem = new CookItem()
            {
                Name = request.ItemName,
            };
            _dbContext.CookItems.Add(newItem);
            _dbContext.SaveChanges();
            return new(newItem);
        }

        [HttpPut("cook_item/{id}")]
        public CookItemResponse? UpdateCookItem(int id, UpdateCookItemRequest request)
        {
            var item = _dbContext.CookItems.FirstOrDefault(i => i.Id == id);
            if (item == null)
            {
                return new("Item not found");
            }
            if (_dbContext.CookItems.Any(i => i.Name == request.ItemName && i.Id != id))
            {
                return new("This name is already used");
            }
            item.Name = request.ItemName;
            _dbContext.SaveChanges();
            return new(item);
        }

        [HttpDelete("cook_item/{id}")]
        public BaseResponse? DeleteCookItem(int id)
        {
            var item = _dbContext.CookItems.FirstOrDefault(i => i.Id == id);
            if (item == null)
            {
                return new("Item not found");
            }
            _dbContext.CookItems.Remove(item);
            _dbContext.SaveChanges();
            return new();
        }
        #endregion

        #region Cook Orders
        [HttpGet("cook_orders")]
        public IEnumerable<CookOrder> GetCookOrders()
        {
            return _dbContext.CookOrders
                .Include(co => co.Table);
        }

        [HttpGet("cook_order/{id}")]
        public CookOrderResponse GetCookOrder(int id)
        {
            var order = _dbContext.CookOrders
                .Include(o => o.Table)
                .Include(o => o.CookOrderItems)
                .ThenInclude(oi => oi.CookItem)
                .FirstOrDefault(o => o.Id == id);
            if (order == null)
            {
                return new("Cook order not found");
            }
            return new(order);
        }

        [HttpPost("cook_order")]
        public CookOrderResponse AddCookOrder(AddCookOrderRequest request)
        {
            var table = _dbContext.ServingTables.FirstOrDefault(t => t.Id == request.TableId);
            if (table == null)
            {
                return new("Table not found");
            }
            var cookItemIds = request.CookItems.Select(i => i.CookItemId).ToList();
            var existingItems = _dbContext.CookItems.Where(i => cookItemIds.Contains(i.Id)).ToList();
            if (existingItems.Count != cookItemIds.Count)
            {
                return new("One or more cook items not found");
            }
            var newOrder = new CookOrder()
            {
                Table = table,
                CreatedAt = DateTimeOffset.Now
            };
            _dbContext.CookOrders.Add(newOrder);
            _dbContext.SaveChanges();

            foreach (var item in request.CookItems)
            {
                _dbContext.CookOrderItems.Add(new Models.CookOrderItem
                {
                    CookOrderId = newOrder.Id,
                    CookItemId = item.CookItemId,
                    Quantity = item.Quantity
                });
            }
            _dbContext.SaveChanges();

            _dbContext.Entry(newOrder).Collection(o => o.CookOrderItems).Load();
            foreach (var oi in newOrder.CookOrderItems)
                _dbContext.Entry(oi).Reference(x => x.CookItem).Load();
            return new(newOrder);
        }

        [HttpPut("cook_order/{id}")]
        public CookOrderResponse UpdateCookOrder(int id, UpdateCookOrderRequest request)
        {
            var order = _dbContext.CookOrders.FirstOrDefault(o => o.Id == id);
            if (order == null)
            {
                return new("Cook order not found");
            }
            if (request.TableId is not null)
            {
                var table = _dbContext.ServingTables.FirstOrDefault(t => t.Id == request.TableId);
                if (table == null)
                {
                    return new("Table not found");
                }
                order.Table = table;
            }
            order.Notes = request.Notes;
            order.IsProcessing = request.IsProcessing;
            order.IsCompleted = request.IsCompleted;
            order.CreatedAt = request.CreatedAt;
            order.StartedAt = request.StartedAt;
            order.CompletedAt = request.CompletedAt;

            _dbContext.SaveChanges();
            return new(order);
        }

        [HttpDelete("cook_order/{id}")]
        public BaseResponse DeleteCookOrder(int id)
        {
            var order = _dbContext.CookOrders.FirstOrDefault(o => o.Id == id);
            if (order == null)
            {
                return new("Cook order not found");
            }
            _dbContext.CookOrders.Remove(order);
            _dbContext.SaveChanges();
            return new();
        }
        #endregion
    }
}
