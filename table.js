var tableConfig = function () {
    
    var itself = {}, local = {};
    local.config = {};
    
    itself.setConfig = function (v){ local.config = v; }
    
	//排序管理
	itself.sort = function (e){
		var m = $(e).attr("d");
		if(m == ""){ $(e).attr("d","asc"); $(e).find(".up").attr("fill","#FF7200"); }
		else if(m == "asc"){ $(e).attr("d","desc"); $(e).find(".up").attr("fill","#828282"); $(e).find(".down").attr("fill","#FF7200");}//#FF7200
		else if(m == "desc"){ $(e).attr("d",""); $(e).find(".up").attr("fill","#828282"); $(e).find(".down").attr("fill","#828282");}
		
		var sorts = "" , p = "" , d = "";
		$.each($(".title-box .icon[d!='']"),function(){
			p = $(this).attr("p"); d = $(this).attr("d");
			if(typeof(p) != "undefined" && typeof(d) != "undefined") sorts += " "+p+ " "+d+",";
		});
		
		return sorts != "" ? sorts.substring(0,sorts.length-1) : sorts;
	}
			
	//列表项配置
	itself.tableConfig = function(){
		layer.open({
		    type: 2,
		    title: '自定义列',
		    maxmin: false,
		    area: ['800px', "90%"],
		    content: 'table-title-config.html'
		});
	}
			
	//操作加载
	itself.featureHtml = function(features){
		//操作
		var featureHtml = "";
		$.each(features, function(i,n) {
			featureHtml += '<span linkid="'+n.linkid+'" param="'+n.paramset+'" executetype="'+n.executetype+'" linkaddress= "'+n.linkaddress+'" data-btns="feature">'+n.linkname+'</span>';
		});
		return featureHtml;
	}
	
	//操作管理
	itself.featureManager = function (linkid,executetype,paramset,linkaddress,linkname){
		
		switch(executetype){
			case "1": window.open("http://"+linkaddress+"?"+paramset); break;
			case "2": 
				var params = paramset.split("&");
				$.each(params, function(i,n) {
					n = n.split("=");
					if(n[0] == "share_search_rybh"){
						n[0] = n[0].toUpperCase();
					}
					sessionStorage.setItem(n[0],n[1]);
				});
				
				popus.open_2(linkname, sessionStorage.webIP+"SLMSWeb/" +linkaddress, "1000px", "90%");
			break;
			case "3": 
				var idx = linkaddress.lastIndexOf("/");
				
				var resname = linkaddress.substring(0, idx);
				var method = linkaddress.substring(idx + 1);
				var parameters = root.packs.pages.request.parameters({"method":method});
				if(paramset != ""){ paramset = JSON.parse(paramset); }
				parameters.parameter = paramset;
				root.packs.pages.request.Ajax(resname,function(json){
					
				},JSON.stringify({"request":parameters}),30000);
			break;
		}
	}
	
	itself.template = function (type){
		switch(type){
			case "titleTd": return '<colnum width="#WIDTH#"><span>#OUTPUTNAME#</span> #SORT#</colnum>'; break;
			case "dataTd":  return '<colnum width="#WIDTH#" title="#CONTENT#">#CONTENT#</colnum>'; break;
			case "sort":    return '<svg class="icon" style="height: 1em; vertical-align: middle;" viewBox="0 0 1024 1024" data-btns="sort" p="#ORDERFIELD#" d="">'+
									'<path d="M733.184 600.576H290.816L512 865.28l221.184-264.704z" fill="#828282" class="down"></path>'+
									'<path d="M290.816 423.424h441.856L512 158.72 290.816 423.424z" fill="#828282" class="up"></path>'+
								'</svg>';
						    break;
			case "operate": return '<colnum class="operate-td">'+
								'<div class="#TDICON#">'+
									'<span class="features-icon operate">'+
										'操作<i class="icon fontSE18 iconfont"></i>'+
							        '</span>'+
							       	'<div class="feature-box"><label></label><div class="features">#CONTENT#</div></div> '+
						        '</div>'+
							'</colnum>';
						    break;
						
		}
	}
	
	//列头加载
	itself.titleHtml = function (titles){
		var json = {};
		var outFreezeColWidth = 57, //固定输出项宽度
			outColWidth = 57; //输出项宽度 
		var defaultTitleHtml = '<th width="80px" style="text-align: center;">操作</th>',
			showcheckboxHtml = "<th width='20px'><input type='checkbox'/></th>";
		
		var varyTitleHtml = defaultTitleHtml , fixedTitleHtml = defaultTitleHtml;
		//复选框
		if(local.config.out_showcheckbox == 1){
			varyTitleHtml = showcheckboxHtml+varyTitleHtml;
			fixedTitleHtml = showcheckboxHtml+fixedTitleHtml;
			outFreezeColWidth += 37;
			outColWidth + 37;
		}
		
		var titletd = "";
		$.each(titles, function(i,n) {
			titletd = itself.template("titleTd");
			titletd = titletd.replace(/#WIDTH#/g,i == titles.length-1 ? '' : n.width+"px");
			titletd = titletd.replace(/#OUTPUTNAME#/g,n.outputname);
			titletd = titletd.replace(/#SORT#/g,n.cansort == 1 ? itself.template("sort").replace(/#ORDERFIELD#/g,n.orderfield) : "");
			
			if( i<local.config.out_freeze_col ){ 
				fixedTitleHtml += titletd; outFreezeColWidth += parseInt(n.width)+17; 
			}
			varyTitleHtml += titletd;
			outColWidth += parseInt(n.width)+17;
		});
		
		//冻结列数小于1
		if(local.config.out_freeze_col < 1){
			fixedTitleHtml = "";
			outFreezeColWidth = 0;
		}
		
		json.outFreezeColWidth = outFreezeColWidth;
		json.outColWidth = outColWidth+50;
		json.fixedTitleHtml = fixedTitleHtml;
		json.varyTitleHtml = varyTitleHtml;
		
		return json;
	}
	
    
    /**
     * 查询数据、操作
     */
    itself.contentTitle = function (data, titles){
    	var json = {}; json.feature = false;
    	var dataMask = "" , showcheckbox = "";
					
		//数据添加操作行
		if(data.feature.length > 0){ json.feature = true; }
		var features = itself.featureHtml(data.feature);
		dataMask = itself.template("operate").replace(/#TDICON#/g,json.feature ? "td-icon" : "td-icon-no").replace(/#CONTENT#/g,features); 
		
		//数据复选框
		if(local.config.out_showcheckbox == 1){ showcheckbox = "<td width='20px'><input type='checkbox'/></td>";}
		
		//数据
		var fixedDom = "" , fixedContent ="",
			varyDom = "" , varyContent ="" ,
			contenttd = "";
		var dataMask1= "";
		$.each(data.data, function(i,n) {
			fixedContent = "" , varyContent = "";
			$.each(titles, function(j,m) {
				contenttd = itself.template("dataTd");
				contenttd = contenttd.replace(/#CONTENT#/g,typeof(n[m.outputid.toLowerCase()]) == "undefined" ? "": n[m.outputid.toLowerCase()]);
				contenttd = contenttd.replace(/#WIDTH#/g,j == titles.length-1 ? '' : m.width+"px");
				
				if( j<local.config.out_freeze_col ){ fixedContent += contenttd;}
				varyContent += contenttd; 
			});
			
			dataMask1 = dataMask;
			//dataMask1 = dataMask1.toLowerCase();
			$.each(n, function(j,m) {
				re =new RegExp("#" +j+ "#","g"); 
				dataMask1 = dataMask1.replace(re,m==""?"":m);
			});
			
			fixedDom += "<tr class='tr"+i+"'>"+ showcheckbox+dataMask1 +fixedContent +"</tr>";
			varyDom += "<tr class='tr"+i+"'>"+ showcheckbox+dataMask1+varyContent+"</tr>";
		});
		if( local.config.out_freeze_col < 1 ){fixedDom = "";}
		
		json.fixedHtml = fixedDom;
		json.varyHtml = varyDom;
		return json;
	}
    
    //加载数据提示内容
    itself.loadAltHtml = function (content){
    	return '<div class="load"> <img src="img/load.gif" style="vertical-align: middle;"> <span class="ml10" style="vertical-align: middle;">'+content+'</span> </div>';
    }
    
    //复选框选择
    itself.checkboxOperate = function (){
    	var obj =  local.config.out_freeze_col < 1 ? $(".c-vary") : $(".c-fixed");
    	$(".title-box input[type='checkbox']").unbind().bind("click",function(){
    		if($(this).is(':checked')){
    			obj.find("input[type='checkbox']").prop("checked",true); 
    		}else{
    			obj.find("input[type='checkbox']").prop("checked",false);
    		}
    	});  
    	obj.find("input[type='checkbox']").unbind().bind("click",function(){
    		if($(this).is(':checked')){
    			var num = obj.find("input[type='checkbox']").length;
    			var checkboxNum = obj.find("input[type='checkbox']:checked").length;
    			if(num == checkboxNum){
    				$(".title-box input[type='checkbox']").prop("checked",true); 
    			}
    		}else{
    			$(".title-box input[type='checkbox']").prop("checked",false);
    		}
    	});
    }
    
    return itself;
};
