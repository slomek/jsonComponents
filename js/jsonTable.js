(function ($) {
	$(document).ready(function(){
		$.widget( "slomek.jsonTable", {

			table : null,
			columnMap: {},

			options: {
				columns: [],
				data: [],
				cssHeader: {},
				selectable: false,
				rowSelect: $.noop,
				rowSelectOnSelectAll: true
			},

			_create: function() {
				this._mapColumns();
				this._renderTable();
				this._renderHeader();
				this._renderBody();
			},

			_mapColumns: function() {
				var _this = this;
				this.columnMap = {};
				this.options.columns.forEach(function(column, index){
					var columnName = _this._getColumnField(column);
					_this.columnMap[columnName] = (index + (_this.options.selectable ? 1 : 0));
				});
			},

			_renderTable: function() {
				this.element.addClass('jsonTableContainer');
				this.table = $('<table>')
						.addClass('jsonTable')
						.appendTo(this.element);
			},

			_renderHeader: function() {
				var _this = this;
				var header = $('<thead>');
				var headerRow = $('<tr>')
						.addClass('headerRow')
						.css(this.options.cssHeader)
						.appendTo(header);
				this._renderHeaderSelect(headerRow);
				this.options.columns.forEach(function(c) {
					$('<th>')
						.text(_this._getColumnName(c))
						.appendTo(headerRow);
				});
				header.appendTo(this.table);
			},

			_renderHeaderSelect: function(headerRow){
				var _this = this;
				if (this.options.selectable) {
					var selectAllCbx = $('<input>')
						.addClass('selectAll')
						.prop({
							'type': 'checkbox',
							'checked': _this.options.selectable.init || false
						})
						.click(function(){
							var value = $(this).prop('checked');
							$('.dataRow .select', _this.table).prop('checked', value);
							if(_this.options.rowSelectOnSelectAll) {
								$('.dataRow', _this.table).each(function(index, row){
									_this.options.rowSelect($(row), value);
								});
							}
						});
					$('<th>')
						.append(selectAllCbx)
						.appendTo(headerRow);
				}
			},

			_renderSelect: function(row) {
				var _this = this;
				if(this.options.selectable){
					var initSelected = row.data('item').selected || _this.options.selectable.init || false;
					var cbx = $('<input>')
							.addClass('select')
							.prop({
								'type': 'checkbox',
								'checked': initSelected
							})
							.change(function(){
								var value = $(this).prop('checked');
								$(row).data('item').selected=value;
								_this.options.rowSelect($(row), value);
								_this._setAllSelected();
							});
					$('<td>')
						.addClass('selectCell')
						.append(cbx)
						.appendTo(row);

					row.data('item').selected = initSelected;
				}
			},

			_setAllSelected: function() {
				var selectedCount = $('.select:checked', this.table).length;
				var allCount = $('.select', this.table).length;
				var ratio = selectedCount/allCount;
				var selectAllCbx = $('.selectAll', this.table);
				if(ratio == 0 || ratio == 1) {
					selectAllCbx.prop('checked', ratio == 1);
					selectAllCbx.prop('indeterminate', false);
				} else {
					selectAllCbx.prop('indeterminate', true);
				}
			},

			_renderBody: function() {
				var _this = this;
				var body = $('<tbody>')
						.addClass('body');

				this.options.data.forEach(function(item) {
					var row = $('<tr>')
							.addClass('dataRow')
							.appendTo(body)
							.data('item', item);

					_this._renderSelect(row);
					_this.options.columns.forEach(function(c){
						var columnField = _this._getColumnField(c);
						var value = _this._getItemsValue(item, columnField);
						$('<td>')
							.text(item[columnField])
							.text(value)
							.appendTo(row);
					});
				});
				body.appendTo(this.table);
			},

			_getItemsValue: function(item, columnField) {
				if(columnField.indexOf('>') == -1) {
					return item[columnField];
				} else {
					var parts = columnField.split('>');
					var primary = parts[0];
					var secondary = parts[1];
					return item[primary][secondary];
				}
			},

			_getColumnName: function(column) {
					if(typeof column ==='string') {
						return column;
					} else {
						return column.display || column.name;
					}
				},

			_getColumnField: function(column) {
				if(typeof column ==='string') {
					return column;
				} else {
					return column.name;
				}
			},

			_destroy: function() {
				$('table', this).remove();
			},

			_setOptions: function( options ) {
			},

			_setOption: function( key, value ) {
			},

			getSelectedRows: function(){
				return $('.dataRow', this.table).filter(function(){
					return $('.select', this).prop('checked');
				});

			},

			getSelected: function() {
				return this.getSelectedRows().map(function(index, row){
					return $(row).data('item');
					});
			},
	
			getData: function() {
				var dataArray = [];
				$('.dataRow', this.table).each(function(index, row){
					dataArray.push($(row).data('item'));
				});
				return dataArray;

			},

			getSelected: function() {
				return this.getSelectedRows().map(function(index, row){
					return $(row).data('item');
					});
			},
	
			getRow: function(index, value) {
				if(typeof index === 'number') {
					var zeroBasedIndex = index+1;
					return $('.dataRow:nth-of-type('+zeroBasedIndex+')', this.table);
				} else {
					var property = index;
					return $('.dataRow', this.table).filter(function(index, el) {
						   return $(el).data('item')[property]==value;
						}).first() || null;
				}
			},

			updateValue: function(rowId, columnName, value, updateItem) {
				var row = this.getRow(rowId);
				var zeroBasedColId = this.columnMap[columnName]+1;
				$('td:nth-of-type('+zeroBasedColId+')', row).text(value);
			},

			getRow: function(index, value) {
				if(typeof index === 'number') {
					var zeroBasedIndex = index+1;
					return $('.dataRow:nth-of-type('+zeroBasedIndex+')', this.table);
				} else {
					var property = index;
					return $('.dataRow', this.table).filter(function(index, el) {
						   return $(el).data('item')[property]==value;
						}).first() || null;
				}
			},

			updateValue: function(rowId, columnName, value, updateItem) {
				var row = this.getRow(rowId);
				var zeroBasedColId = this.columnMap[columnName]+1;
				$('td:nth-of-type('+zeroBasedColId+')', row).text(value);
			},

			updateData: function(newData, place) {
				$('tbody', this.element).remove();
				if(!place || place === 'instead') {
					this.options.data = newData;
					this._renderBody();
					this._setAllSelected();
				} else if(place === 'start') {
					var data = this.options.data;
					newData.push.apply(newData, data);
					this.updateData(newData);
				} else if(place === 'end') {
					var data = this.options.data;
					data.push.apply(data, newData);
					this.updateData(data);
				}
			},

			sort: function(field, order) {
				var data = this.options.data;
				var dir;
				if(!order || order === 'asc') {
					dir = 1;
				} else {
					dir = -1;
				}
				var data = this.options.data.sort(
						function(f,s){
							if(f[field]>s[field]) {
								 return 1*dir;
							} else if(f[field]<s[field]) {
								 return -1*dir;
							} else {
								return 0; 
							}
						});
				this.updateData(data);
			}	

		});
	});
})(jQuery);
