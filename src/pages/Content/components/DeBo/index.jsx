import React, { useState } from 'react';
import { Button, Input, message } from 'antd';
import cookie from 'cookiejs';
// http://debo.gonghongzc.com/adminapi/product/product/0
// POST

export default () => {
  const [ids, setIds] = useState('');
  const [load, setLoad] = useState(false)

  const handleInput = (e) => {
    setIds(e.target.value.trim());
  };

  const handleExport = () => {
    if (!ids.length) {
      alert('不能为空！');
      return;
    }

    //去获取小米的token
    chrome.runtime.sendMessage({ type: 'getCookie' }, async (xmToken) => {
      // getProduct(id, xmToken);
      setLoad(true)
      try {
        await Promise.all(
          ids.split(',').map(async (id) => {
            if (id == '') return;
            await getProduct(id, xmToken);
          })
        );
        setLoad(false)
      } catch (e) {
        console.log('出错了', e);
      }
    });
  };

  const getProduct = async (id, xmToken) => {
    let M = `https://www.kuzhenghua.com/adminapi/product/product/${id}`;

    const response = await fetch(M, {
      headers: {
        'Authori-Zation': `Bearer ${xmToken}`,
      },
    });
    const data = await response.json();
    await exportDebo(data.data.productInfo);
  };

  const exportDebo = async (productInfo) => {
    const r1 = {
      disk_info: '',
      logistics: productInfo.logistics,
      freight: 3,
      postage: 0,
      recommend: productInfo.recommend,
      presale_day: 1,
      presale: false,
      is_limit: false,
      limit_type: 0,
      limit_num: 0,
      video_open: false,
      vip_product: false,
      custom_form: [],
      store_name: productInfo.store_name,
      cate_id: [28, 29, 30],
      label_id: [],
      keyword: productInfo.keyword,
      unit_name: productInfo.unit_name,
      store_info: productInfo.store_info,
      image: productInfo.image,
      recommend_image: productInfo.recommend_image,
      slider_image: productInfo.slider_image,
      description: productInfo.description,
      ficti: 0,
      give_integral: 0,
      sort: 0,
      is_show: 0,
      is_hot: 0,
      is_benefit: 0,
      is_best: 0,
      is_new: 0,
      is_good: 0,
      is_postage: 0,
      is_sub: [],
      recommend_list: [],
      virtual_type: 0,
      id: 0,
      spec_type: 0,
      is_virtual: 0,
      video_link: productInfo.video_link,
      temp_id: 1,
      items: productInfo.items,
      activity: ['默认', '秒杀', '砍价', '拼团'],
      couponName: [],
      header: [],
      selectRule: '',
      coupon_ids: [],
      command_word: '',
      type: 0,
      is_copy: 0,
    };


    if(productInfo.spec_type == 1){
      r1['attrs'] = productInfo['attrs']
      r1['items'] = productInfo['items']
      r1['spec_type'] = 1;
    }else{
      r1['attrs'] = [
        {
          pic: productInfo.image,
          price: productInfo.price,
          cost: productInfo.cost,
          ot_price: productInfo.ot_price,
          stock: productInfo.stock,
          bar_code: productInfo.bar_code,
          weight: 0,
          volume: 0,
          brokerage: 0,
          brokerage_two: 0,
          vip_price: 0,
          virtual_list: [],
          coupon_id: 0,
        },
      ]
    }


    const response = await fetch(
      `http://debo.gonghongzc.com/adminapi/product/product/0`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authori-Zation': `Bearer ${cookie.get('token')}`,
        },
        body: JSON.stringify(r1),
      }
    );
    const data = await response.json();
    if(data.code === '100000'){
      message.success(data.msg);
    }else{
      message.error(data.msg);
    }
    
  };

  return (
    <div>
      <div>
        <Input
          onChange={handleInput}
          addonAfter={
            <Button type="primary" onClick={handleExport} loading={load}>
              导入
            </Button>
          }
        />
      </div>
    </div>
  );
};
