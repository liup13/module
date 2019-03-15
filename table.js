/**
 * @summary     table
 * @desc        基于jQuery的列表生成器
 * Changelog：
 */
;
(function ($) {
    "use strict";
    /**
     * 默认参数集
     */
    var defaults = {
        width: 1000,
        notHight: 340,
        moreHeight:0,
        freezeColNum: 1, /**冻结列数 || @type int 默认 1*/
        isCheckbox: true,/** * 是否显示复选框 */
        isOrder: true, /** * 是否显示序号 */
        isoperate:true,
        template:1,/** * 模板 默认1 通用列表 2 没有滚动条 背景透明 3 弹出列表（灰色）  9 只有分页  10 特殊列表 没有hover颜色 */
        hiddenCols: [], /**隐藏列 hiddenCols:["id","xx"] */
        isSetTitle:true,
        /**
         * 列表头数据
         * name:""  名称
         * width：""  宽度
         * istitle:true,是否显示title
         * issort:false  是否显示排序  desc 降序 ， asc  升序
         *
         */
        titles: [],
        datas: [],/** * 列数据 */
        operate: [], /**操作组 */
        batchButton: [], /**批量操作组 */
        ispage: true, /**  是否显示分页，默认显示  @type boolean */
        total:0,
        pageFn: function (pageIndex, pageSize) {}, /**分页回调*/
        sortFn:function(v){}, /**排序回调 */
    };


    /**
     * @constructor
     * 插件初始化
     * @param {Object} event - 插件的初始化元素。
     * @param {Object} option - 初始化参数
     */
    var table = function (event, option) {
        this.setOption(option);

        this.setCssClass();
        this.setProp();

        //考核列表设置
        if(option.template == 1) {
            var state = 0;
            try{
                state = sessionStorage.getItem("HCZT");
                if(option.isSetTitle)$(".mt50.fontSE24").text(customQueryTitleName);
                if (state == 1) {
                    this.option.isoperate = false;
                    this.option.operate = option.operate = [];
                    this.option.isCheckbox = option.isCheckbox = false;
                    $(".table-search-box .fn-right").remove();
                }
            }
            catch(e){}
        }
        if(option.template == 9) this.pageHtml(event);
        else{
            if (option.isCheckbox) this.prop.outFreezeColWidth += this.prop.tdWidth;
            if (option.isOrder) this.prop.outFreezeColWidth += this.prop.orderWidth;
            if (option.operate.length > 0) this.prop.outFreezeColWidth += this.prop.opTdWidth;

            this.setElem();
            this.title();
            (option.datas.length > 0) && (this.showData(event));
            (option.ispage) && this.pageHtml(event);
            $(event).append(this.elem.box);
            $(event).append(this.elem.fixedTable);
            (option.batchButton.length>0) && $(event).append(this.batchButtonHtml());

            this.eOperate();
            this.tableCalculate();
            this.oSort();
            this.eBatch();
        }
    };
    /**
     * 插件缓存内部对象的KEY
     */
    table.dataKey = 'tableObject';
    /**
     * 参数初始化
     * @param {Object} option - 参数集
     */
    table.prototype.setOption = function (option) {
        this.option = $.extend(true, {}, defaults, option);
    };

    /**
     * CSS样式表名称字义
     */
    table.prototype.setCssClass = function () {
        var css_class = {
            table_box: 'list_wap',
            table_header_wraper: 'title-box',
            table_body: 'content-box',
            fixed_table_left_header: 't-fixed',
            table_header: 't-vary',
            fixed_table_left_box: 'fixed_table_left_box',
            fixed_table_left_content: 'c-fixed',
            fixed_table_left_body: 'c-vary',
            operates: 'feature-box fn-clear',
            batchs: 'batchs fn-clear',
            check_box:'table-check-box',//复选框
            check_box_choose:'table-checked-box', //选中复选框
        };
        this.css_class = css_class;
    };



    /**
     * 插件内部属性设置默认值
     */
    table.prototype.setProp = function () {
        this.prop = {
            tdWidth: 40, //td复选框默认宽度
            orderWidth: 50,//序号默认宽度
            opTdWidth: 72,//操作项默认宽度
            outFreezeColWidth: 0, //冻结列总宽度
            colHeight: 36, //列高
            noTableHeight: 200, //不属于列表的高度
            colWidthHtml: '', // 表格宽度DOM
            fixedColWidthHtml: '', // 冻结表格宽度DOM
            pageIndex: 1,
            pageSize: 10,
            pageCount: 0, //分页总页数
            showTdCodes: [],//title显示的code
            fixedShowTdCodes: [],//冻结title显示的code
            hiddenDatas: {},
            sortDatas: {}
        };
    };

    /**
     * 生成表格宽度
     * @param [] array
     */
    var colWidthHtml = function (array) {
        var colWidthHtml = "<colgroup>";

        array.forEach(element => {
            colWidthHtml += '<col style="width: ' + element + 'px;" />';
        });

        colWidthHtml += '</colgroup>';
        return colWidthHtml;
    }

    /**
     * 生成表格头部
     */
    table.prototype.tableTitleHtml = function (datas,type) {
        var self = this,
            p = this.option;
        var rowHtml = '',
            widthArray = [];
        var checkBox = '<th><i class="iconfont table-check-box">&#xe65e;</i></th>';
        var orderHtml = '<th><span class="SN fontSE20">SN.</span></th>';
        var sortHtml = '';

        datas.forEach(element => {
            sortHtml = "";
            switch (element.issort) {
                case true:
                    sortHtml = '<span class="sort" param="'+(element.orderfield || element.code)+'"><i class="iconfont sort-up">&#xe7fe;</i><i class="iconfont sort-down">&#xe74d;</i></span>';
                    break;
                case "desc":
                    self.prop.sortDatas[(element.orderfield || element.code)] = "desc";
                    sortHtml = '<span class="sort desc" param="'+(element.orderfield || element.code)+'"><i class="iconfont sort-up">&#xe7fe;</i><i class="iconfont sort-down">&#xe74d;</i></span>';
                    break;
                case "asc":
                    self.prop.sortDatas[(element.orderfield || element.code)] = "asc";
                    sortHtml = '<span class="sort asc" param="'+(element.orderfield || element.code)+'"><i class="iconfont sort-up">&#xe7fe;</i><i class="iconfont sort-down">&#xe74d;</i></span>';
                    break;
            }
            rowHtml += '<th>' + element.name + sortHtml + '</th>';
            widthArray[widthArray.length] = element.width;

            //保存需要显示数据Code
            element.istitle = typeof (element.istitle) =="undefined" ? true : element.istitle;

            switch (type){
                case "fixed": self.prop.fixedShowTdCodes[self.prop.fixedShowTdCodes.length] = element; break;
                default: self.prop.showTdCodes[self.prop.showTdCodes.length] = element; break;
            }

        });

        //判断是否有操作组
        if(p.operate.length > 0){ rowHtml = '<th>操作</th>' + rowHtml, widthArray.splice(0, 0, self.prop.opTdWidth); }
        //判断是否有序号
        (p.isOrder) && (rowHtml = orderHtml + rowHtml, widthArray.splice(0, 0, self.prop.orderWidth));
        //判断是否显示复选框
        (p.isCheckbox) && (rowHtml = checkBox + rowHtml, widthArray.splice(0, 0, self.prop.tdWidth));

        rowHtml = '<tr>' + rowHtml + '</tr>';

        switch (type){
            case "fixed": self.elem.fixedColWidthHtml = colWidthHtml(widthArray); rowHtml = self.elem.fixedColWidthHtml + rowHtml; break;
            default: self.elem.colWidthHtml = colWidthHtml(widthArray); rowHtml = self.elem.colWidthHtml + rowHtml; break;
        }
        // self.elem.colWidthHtml = colWidthHtml(widthArray);
        return rowHtml;
    }

    /**
     * 生成表格数据
     * @param {*} datas
     * type 类型 freeze： 冻结数据
     */
    table.prototype.tableDataHtml = function (type) {
        var self = this,
            p = this.option;

        var hiddenDatas = {};
        var fixedDataHtml = "",
            td = "";

        p.datas.forEach(function(val,index){
            const obj = val;
            td = "";
            //判断是否显示复选框
            if (p.isCheckbox) td += '<td><i class="iconfont table-check-box">&#xe65e;</i></td>';
            //判断是否有序号
            if (p.isOrder) td += '<td class="font-number-en fontSE20">'+obj.rn+'</td>';

            //判断是否为本人操作
            if(typeof(obj.crt_userid) != "undefined" && sessionStorage.userid != obj.crt_userid){
                if(typeof(obj.notOperate) == "undefined"){ obj.notOperate = []; }
                obj.notOperate.push("删除");
                obj.notOperate.push("修改");
            }


            //判断是否有操作组
            if (p.operate.length > 0) td += '<td class="operate-td"><div class="operate-box">' + self.operateHtml(obj.notOperate) + '</div></td>';

            //加载隐藏数据
            $.each(p.hiddenCols, function (i, n) {
                hiddenDatas[n] = obj[n];
            });

            var xbStr = "" ,ryztStr = "";
            //加载数据
            switch (type) {
                case "freeze":
                    $.each(self.prop.fixedShowTdCodes, function (i, n) {
                        if (i < p.freezeColNum) {
                            if(n.code == "xm") {
                                xbStr = "";ryztStr ="";
                                if(typeof(obj.xb) != "undefined") xbStr = obj.xb == "1" ? '<i class="list-sex iconfont fontCR06">&#xe604;</i>': obj.xb == "2" ? '<i class="list-sex iconfont fontCR07">&#xe605;</i>':"<i class='list-sex iconfont'></i>";
                                if(obj.ryzt=="11") ryztStr = '<label class="fontSE12 list-status-history">历史</label>';
                                if(obj.rylb=="2")ryztStr += '<label class="fontSE12 list-status-history">代管</label>';
                                td += '<td title="' + obj[n.code] + '"><div class="box-flex" style="align-items: center;"><a class="pointer mr10" onclick="openPersonDetailHtml(\''+obj.rybh+'\');">' + obj[n.code] + '</a>'+ryztStr+xbStr+'</div></td>';
                                return true;
                            }
                            td += '<td title="' + (n.istitle ? obj[n.code] : "") + '">' + obj[n.code] + '</td>';
                        }
                    });
                    break;
                default:
                    $.each(self.prop.showTdCodes, function (i, n) {
                        if(n.code == "xm") {
                            xbStr = "";ryztStr ="";
                            if(typeof(obj.xb) != "undefined" && obj.xb!="") xbStr = obj.xb == "1" ? '<i class="iconfont fontCR06">&#xe604;</i>': obj.xb == "2" ? '<i class="iconfont fontCR07">&#xe605;</i>':"";
                            if(obj.ryzt=="11") ryztStr = '<label class="fontSE12 list-status-history">历史</label>';
                            if(obj.rylb=="2")ryztStr += '<label class="fontSE12 list-status-history">代管</label>';
                            td += '<td title="' + obj[n.code] + '"><div class="box-flex" style="align-items: center;"><a class="pointer mr10" onclick="openPersonDetailHtml(\''+obj.rybh+'\');">' + obj[n.code] + '</a>'+ryztStr+xbStr+'</div></td>';
                            return true;
                        }
                        td += '<td title="' + (n.istitle ? obj[n.code] : "") + '">' + obj[n.code] + '</td>';
                    });
                    break;
            }

            fixedDataHtml += "<tr class='tr"+index+"' param='" + JSON.stringify(hiddenDatas) + "'>" + td + "</tr>";
        })

        return fixedDataHtml;
    }

    /**
     * 插件HTML结构生成
     */
    table.prototype.setElem = function () {
        var self = this,
            p = this.option;
        // 1. 生成、替换DOM对象
        var elem = {}; //本体

        elem.header = $('<div>').addClass(this.css_class.table_header_wraper);
        elem.fixedHeaderTable = $('<div><table>').addClass(this.css_class.fixed_table_left_header);
        elem.headerTable = $('<div><table>').addClass(this.css_class.table_header);

        elem.body = $('<div>').addClass(this.css_class.table_body);
        elem.fixedBodyTable = $('<div><table>').addClass(this.css_class.fixed_table_left_content);
        elem.bodyTable = $('<div><table>').addClass(this.css_class.fixed_table_left_body);


        elem.box = $('<div>').addClass(this.css_class.table_box + " " + this.css_class.table_box+p.template);

        $(elem.header).append(elem.fixedHeaderTable);
        $(elem.header).append(elem.headerTable);
        $(elem.body).append(elem.fixedBodyTable);
        $(elem.body).append(elem.bodyTable);
        $(elem.box).append(elem.header).append(elem.body);
        this.elem = elem;

        $(elem.headerTable).find("table").append(self.tableTitleHtml(p.titles));
    };

    /**
     * 添加冻结表头
     */
    table.prototype.title = function(){
        var self = this,
            p = this.option;
        //表头数据
        var fixedTitleDatas = [];
        for (const i in p.titles) {
            if (i < p.freezeColNum) {
                fixedTitleDatas[i] = p.titles[i];
                self.prop.outFreezeColWidth += parseInt(p.titles[i].width);
            }
        }
        $(self.elem.fixedHeaderTable).find('table').html(self.tableTitleHtml(fixedTitleDatas,"fixed")).css("width", self.prop.outFreezeColWidth);

    }
    /**
     * 冻结数据
     */
    table.prototype.freezeColData = function () {
        var self = this;
        //数据内容
        var fixedDataHtml = self.tableDataHtml("freeze");
        $(self.elem.fixedBodyTable).find('table').html(self.elem.fixedColWidthHtml + fixedDataHtml).css("width", self.prop.outFreezeColWidth);
    }

    /**
     * 添加数据
     */
    table.prototype.showData = function (event) {
        var self = this,
            p = this.option;

        if(p.datas.length == 0){ $(self.elem.body).find(".c-fixed table").html(""); $(self.elem.body).find(".c-vary table").html('<tr><td colspan="17" style="text-align: center;">无数据</td></tr>') }
        else{
            var contentHtml = self.tableDataHtml();
            $(self.elem.bodyTable).find('table').html("").html(self.elem.colWidthHtml + contentHtml);
            self.freezeColData();
            self.eCheckBox();
        }

        $(self.elem.body).scroll(function() {
            $(this).prev().find(".t-vary").css("left","-"+$(this).scrollLeft()+'px');
            $(this).find(".c-fixed").css("left",$(this).scrollLeft());
        });

        if(p.template == 10) return false;

        var hoverbackgroud = "#1b2e3f";
        if(p.template == 3 || p.template == 4) hoverbackgroud = "#eee";
        //设置表格hover样式
        if(p.datas.length==0){return false;}

        $(self.elem.body).find(".c-vary tr , .c-fixed tr").bind('mouseenter',function(){
            $(self.elem.body).find("."+$(this).attr("class")).css("background",hoverbackgroud);
        }).bind('mouseleave',function(){
            $(self.elem.body).find("."+$(this).attr("class")).css("background","");
        });


        if(!self.option.isoperate){ $(".list-status").remove(); }
    };

    /**
     * 操作列
     */
    table.prototype.operateHtml = function (notOperate) {
        var p = this.option;
        var operateItems = "",
            i = 0;
        p.operate.forEach(element => {
            ($.inArray(element.name,notOperate)<0) && ( operateItems = operateItems + "<span class='operate-btn' limit-hide='"+(element.name=='查看'? 'false':'true') +"' p='" + i + "' >" + element.name + "</span>");
            i++;
        });

        return '<span class="operate '+(operateItems == "" ? "prohibit":"")+'">操作<i></i></span><div class="' + this.css_class.operates + '"><div class="features">' + operateItems + '</div></div>';
    }

    /**
     * 批量操作 （自定义绑定）
     */
    table.prototype.batchButtonHtml = function () {
        var p = this.option;
        var operateItems = "", operateItem = "",moreBoxObject = "", i = 0 ,j = 0;
        p.batchButton.forEach(element => {
            if(element.ismore){
                operateItem = "",j=0;
                element.mores.forEach(element => {
                    operateItem = operateItem + "<span class='operate-btn fontSE14' p='" + i +","+ j + "' >" + element.name + "</span>";
                    j++;
                });
                moreBoxObject = '<div class="' + this.css_class.operates + '"><div class="features">' + operateItem + '</div></div>';
                operateItems += "<li class='batch-more-btn operate p-relative fn-left' >" + element.name + "<i></i>"+moreBoxObject+"</li>";
            }else{
                operateItems += "<li class='batch-btn' p='" + i + "' >" + element.name + "</li>";
            }
            i++;
        });

        return '<ul class="' + this.css_class.batchs + '">' + operateItems + '</ul>';
    }

    /**
     * 最后的列表计算
     */
    table.prototype.tableCalculate = function () {
        var self = this,
            elem = this.elem;
        const height = document.documentElement.clientHeight;

        elem.headerTable.css('min-width', self.option.width);
        elem.bodyTable.css('min-width', self.option.width );

        elem.bodyTable.find("table").css('width', elem.headerTable.find("table").width()-4 );

        elem.body.css('height', height-this.option.notHight-this.option.moreHeight);

        $(window).resize(function(){
            elem.bodyTable.find("table").css('width', elem.headerTable.find("table").width() );
        });

    }

    // /**
    //  * 考核列表设置
    // */
    // table.prototype.khsz = function(event){
    //    var self = this,
    //        p = this.option;
    //    var state = 0;
    //    try {
    //        state = sessionStorage.getItem("HCZT");
    //        if(p.isSetTitle)$(".mt50.fontSE24").text(customQueryTitleName);
    //        if (state == 1) {
    //            p.isoperate = false;
    //            p.operate = [];
    //        	// $(".mt50.fontSE24").text(customQueryTitleName);
    //        	// $(".hr-short").css("margin-bottom","40px");
    //            $(".table-search-box .fn-right").remove();
    //            // p.moreHeight = -30;
    //            // const height = document.documentElement.clientHeight;
    //            // self.elem.body.css('height', height-p.notHight-p.moreHeight);
    //            // setTimeout(function(){
    //             //    // $("[limit-hide='true']").remove();
    //             //    $(".list-status").remove();
    // 			// },1000)
    //
    //        }
    //    }
    //    catch (e) { }
    // }

    /**
     * 加载分页
     */
    table.prototype.pageHtml = function (event) {
        var self = this,
            p = this.option;
        if(typeof(p.pageSize) == "undefined")  return false;

        $(event).find(".pages").remove();
        self.prop.pageIndex =1;
        var start = 1, count = 0;
        (p.pageSize != 0) && (p.total != 0) && (count = Math.ceil(p.total / p.pageSize));

        var page = $('<div>').addClass('pages');
        var _total = '<span class="mr20">记录数：' + p.total + ' 条</span>&nbsp;<span class="mr20">共' + count + '页</span>';
        var _first = '<button class="jPag-first" p="previous" disabled><</button>';
        var _last = '<button class="jPag-last" p="next" disabled> > </button>';
        var _item = '<div class="page-items" style="display: inline-block;">' + appendPageItem(start, count) + '</div>';

        var _ul = '<span>每页显示 <input type="text" value="' + p.pageSize + '" class="totalPage" p="page-size" style=""/> 条</span>';
        $(page).append(_total + _first + _item + _last + _ul);
        $(event).append(page);

        $(".jPag-last").attr("disabled", start == count);

        if(count == 0){ $(".jPag-first").hide();$(".jPag-last").hide(); }

        self.prop.pageCount = count;
        $(event).find(".pages").find("button[p='"+self.prop.pageIndex+"']").addClass("current");
        self.ePage(event);
    }
    /**
     * @param {*} curIndex  当前页
     * @param {*} count 总页数
     */
    var appendPageItem = function (curIndex, count) {
        var _item = '',
            start = 0,
            endSeat = 0,
            pageNum = 3; //显示多少个页码

        $(".jPag-first").attr("disabled", curIndex == 1);
        $(".jPag-last").attr("disabled", curIndex == count);

        //计算开始页
        curIndex = parseInt(curIndex);
        start = curIndex < 3 ? 2 : curIndex;
        start = count - curIndex < 2 ? count - 2 : curIndex -1;
        start = start == 0 ? 1 : start;

        if(count == 1){ _item += '<button p="1">1</button>'; }
        else if(count > 1) {
            _item += '<button p="1">1</button>';
            if (start > 2) _item += '<span class="points">…</span>';
            endSeat = pageNum + start - 1;
            endSeat = endSeat >= count ? count - 1 : endSeat;
            endSeat = count == 1 ? count : endSeat;

            for (var i = start; i <= endSeat; i++) {
                if(i!=1) _item += '<button p="' + i + '">' + i + '</button>';
            }

            if (endSeat  <= (count-2)) {
                _item += '<span class="points">…</span>';
            }

            if (count != 1) _item += '<button p="' + count + '">' + count + '</button>';
        }
        return _item;
    }

    /**
     * 排序事件绑定
     */
    table.prototype.oSort = function () {
        var self = this,
            p = this.option;
        var fixedHeaderTable = $(self.elem.fixedHeaderTable); //固定头部Box
        var headerTable = $(self.elem.headerTable);
        headerTable.off().on("click", ".sort", function () {
            $(this).removeClass("desc");
            $(this).removeClass("asc");
            var c = $(this).attr("param");
            self.prop.sortDatas[c] = typeof(self.prop.sortDatas[c])=="undefined"? "desc":self.prop.sortDatas[c] == "desc" ? "asc" : self.prop.sortDatas[c] == "asc" ? "":self.prop.sortDatas[c] == "" ? "desc":"";

            $(this).addClass(self.prop.sortDatas[c]);
            if(self.prop.sortDatas[c] == ""){  delete self.prop.sortDatas[c];}
            p.sortFn(self.prop.sortDatas);
        });
        fixedHeaderTable.off().on("click", ".sort", function () {
            $(this).removeClass("desc");
            $(this).removeClass("asc");
            var c = $(this).attr("param");
            self.prop.sortDatas[c] = typeof(self.prop.sortDatas[c])=="undefined"? "desc":self.prop.sortDatas[c] == "desc" ? "asc" : self.prop.sortDatas[c] == "asc" ? "":self.prop.sortDatas[c] == "" ? "desc":"";
            $(this).addClass(self.prop.sortDatas[c]);
            if(self.prop.sortDatas[c] == ""){  delete self.prop.sortDatas[c];}
            p.sortFn(self.prop.sortDatas);
        });
    }

    /**
     * 复选框操作事件绑定
     */
    table.prototype.eCheckBox = function(){
        var self = this;

        var checkBoxChooseClass = "."+self.css_class.check_box_choose;//复选框选中Class
        var checkBoxClass = "."+self.css_class.check_box;//复选框
        var headerTable = $(self.elem.fixedHeaderTable); //固定头部Box
        var children = $(self.elem.fixedBodyTable); //固定内容Box
        var parentCheckBox = headerTable.find(checkBoxClass);
        var childrenCheckBoxs = children.find(checkBoxClass);

        children.find(checkBoxClass).unbind().bind("click",function (e) {
            e.stopPropagation();
            if($(this).hasClass(self.css_class.check_box_choose)){
                $(this).removeClass(self.css_class.check_box_choose).html("&#xe65e;");
                if(parentCheckBox.hasClass(self.css_class.check_box_choose))parentCheckBox.removeClass(self.css_class.check_box_choose).html("&#xe65e;");
            }else{
                $(this).addClass(self.css_class.check_box_choose).html("&#xe608;");
                if( childrenCheckBoxs.length == children.find(checkBoxChooseClass).length ){
                    parentCheckBox.addClass(self.css_class.check_box_choose).html("&#xe608;");
                }
            }
        });

        headerTable.find(checkBoxClass).unbind().bind("click",function () {

            if($(this).hasClass(self.css_class.check_box_choose)){
                $(this).removeClass(self.css_class.check_box_choose).html("&#xe65e;");
                childrenCheckBoxs.removeClass(self.css_class.check_box_choose).html("&#xe65e;");
            }else{
                $(this).addClass(self.css_class.check_box_choose).html("&#xe608;");
                childrenCheckBoxs.addClass(self.css_class.check_box_choose).html("&#xe608;");
            }
        });
    }
    /**
     * 操作项事件绑定
     */
    table.prototype.eOperate = function () {
        var self = this,
            p = this.option;

        $(self.elem.fixedBodyTable).off().on("click", ".operate-btn", function () {
            var c = $(this).attr("p");
            var v = $(this).parents("tr").attr("param");
            v = JSON.parse(v);
            p.operate[c].successFn(v);
        });
    }

    /**
     * 批量操作项事件绑定
     */
    table.prototype.eBatch = function () {
        var self = this,
            p = this.option;
        var batchsBtnObject = $(self.elem.box).next(".batchs");
        var headerTable = $(self.elem.fixedHeaderTable); //固定头部Box
        var checkBoxClass = "."+self.css_class.check_box;//复选框
        var parentCheckBox = headerTable.find(checkBoxClass);

        batchsBtnObject.find(".batch-btn").click(function () {
            var c = $(this).attr("p");
            var v = [] , json ={};

            //获取选中的复选框值
            $($(self.elem.fixedBodyTable).find(".table-checked-box")).each(function () {
                json = $(this).parents("tr").attr("param");
                json = JSON.parse(json);
                v.push(json);
            });

            parentCheckBox.removeClass(self.css_class.check_box_choose).html("&#xe65e;");
            p.batchButton[c].successFn(v);
        });

        batchsBtnObject.find(".batch-more-btn .operate-btn").click(function(){
            var c = $(this).attr("p").split(",");
            var v = [];

            //获取选中的复选框值
            $($(self.elem.fixedBodyTable).find(".table-checked-box")).each(function () {
                v.push($(this).parents("tr").attr("param"));
            });

            parentCheckBox.removeClass(self.css_class.check_box_choose).html("&#xe65e;");
            p.batchButton[c[0]].mores[c[1]].successFn(v);
        });

    }

    /**
     * 分页的事件绑定
     */
    table.prototype.ePage = function (event) {
        var self = this,
            p = this.option;

        $(event).find(".totalPage").change(function () {
            var v = $(this).val();
            var regu = /^[1-9]\d*$/;
            if(v.length>4) { $(this).val(self.option.pageSize); return false; }
            if (!regu.test(v) || v == "") { $(this).val(self.option.pageSize); return false; }
            self.option.pageSize = parseInt(v);
            self.prop.pageIndex = 1;
            p.pageFn(self.prop.pageIndex, self.option.pageSize);
            self.pageHtml(event);
        });
        $(event).find(".page-items").on("click","button",function(){
            var v = $(this).attr("p");
            self.prop.pageIndex = parseInt(v);
            p.pageFn(self.prop.pageIndex,p.pageSize);
            setPageBtn(event,self.prop.pageIndex,p.pageSize,self.prop.pageCount);
        });

        $(event).find(".jPag-last").click(function(){
            self.prop.pageIndex++;
            p.pageFn(self.prop.pageIndex,p.pageSize);
            setPageBtn(event,self.prop.pageIndex,p.pageSize,self.prop.pageCount);
        });
        $(event).find(".jPag-first").click(function(){
            self.prop.pageIndex--;
            p.pageFn(self.prop.pageIndex,p.pageSize);
            setPageBtn(event,self.prop.pageIndex,p.pageSize,self.prop.pageCount);
        });
    }

    //设置分页按钮
    function setPageBtn(event,pageIndex,pageSize,pageCount){
        $(event).find(".page-items").html(appendPageItem(pageIndex,pageCount));
        $(event).find("button[p='"+pageIndex+"']").addClass("current");
    }





    /**
     * 控件初始化入口
     * @global
     * @param option {Object} 初始化参数集
     */
    function Plugin(option) {
        return this.each(function () {
            $(this).find(".list_wap").remove();
            var $this = $(this),
                data = $this.data(table.dataKey),
                params = $.extend({}, defaults, typeof option === 'object' && option);

            $this.data(table.dataKey, (data = new table(this, params)));
        });
    }

    $.fn.setPage = function(option){
        return this.each(function () {
            var $this = $(this),
                data = $this.data(table.dataKey),
                params = $.extend({}, defaults, $this.data(), data && data.option, typeof option === 'object' && option);
            if (!data) { params.template = 9, $this.data(table.dataKey, (data = new table(this, params)));  }
            else{
                data.option = $.extend({}, data.option, data.option && (typeof option === 'object' && option));
                (data.option.ispage) && data.pageHtml(this);
            }
        });



    }

    $.fn.setData = function(option){
        var $this = $(this),
            data = $this.data(table.dataKey);
        data.option = $.extend({}, data.option, data.option && (typeof option === 'object' && option));
        // data.option.ispage = true;
        data.showData(this);
    }

    $.fn.setHeight = function(option){
        var $this = $(this),
            data = $this.data(table.dataKey);
        data.option = $.extend({}, data.option, data.option && (typeof option === 'object' && option));

        const height = document.documentElement.clientHeight;
        data.elem.body.css('height', height-data.option.notHight-data.option.moreHeight);
    }

    $.fn.loading = function(){
        var $this = $(this),
            data = $this.data(table.dataKey);
        data.option = $.extend({}, data.option, data.option && (typeof option === 'object' && option));
        $(data.elem.body).find(".c-fixed table").html(""); $(data.elem.body).find(".c-vary table").html('<div class="mt20" style="text-align: center;"><img src="./images/load.gif"></div>');
    }
    $.fn.table = Plugin;


})(window.jQuery);