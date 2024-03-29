import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Cache } from 'cache-manager';
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { SearchCreatorOutput } from './dto/search.creator.output';
import { SearchProductOutput } from './dto/search.product.output';

export enum ES_IDX_TYPE {
  CREATOR_IDX = 'zero9creator',
  PRODUCT_IDX = 'zero9product',
}

@Injectable()
export class SearchService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async setCache(key: string, data: any[], mode: ES_IDX_TYPE) {
    const isSaved = await this.cacheManager.set(`${mode}:${key}`, data, {
      ttl: 10,
    });
    console.log('레디스에 저장 여부:', isSaved);
    return isSaved;
  }

  async getCache(key: string, mode: ES_IDX_TYPE) {
    const searchResultInCache: Partial<
      SearchCreatorOutput[] | SearchProductOutput[]
    > = await this.cacheManager.get(`${mode}:${key}`);

    if (searchResultInCache) {
      console.log(
        'Redis searchResult:',
        JSON.stringify(searchResultInCache, null, ' '),
      );

      if (mode === ES_IDX_TYPE.CREATOR_IDX) {
        searchResultInCache.forEach((el) => {
          el.createdAt = new Date(el.createdAt);
          el.deletedAt = el.deletedAt ? new Date(el.deletedAt) : null;
        });
      } else {
        searchResultInCache.forEach((el) => {
          el.validFrom = el.validFrom ? new Date(el.validFrom) : null;
          el.validUntil = el.validUntil ? new Date(el.validUntil) : null;
          el.createdAt = new Date(el.createdAt);
          el.deletedAt = el.deletedAt ? new Date(el.deletedAt) : null;
          el.updatedAt = new Date(el.updatedAt);
        });
      }

      return searchResultInCache;
    }
  }

  searchCreators = async (word: string, page: number, size: number) =>
    await this.searchInES(word, ES_IDX_TYPE.CREATOR_IDX, page, size);

  searchProducts = async (word: string, page: number, size: number) =>
    await this.searchInES(word, ES_IDX_TYPE.PRODUCT_IDX, page, size);

  /** !주의: product ES검색에서 크리에이터 정보 구성시엔 사용하지 말것! */
  private getCreator = (mapElement) => {
    const d = mapElement._source;
    return {
      id: d.id,
      email: d.email,
      userType: d.usertype,
      nickname: d.nickname,
      phoneNumber: d.phonenumber,
      zipcode: d.zipcode,
      address: d.address,
      addressDetail: d.addressdetail,
      profileImg: d.profileImg,
      creatorAuthImg: d.creatorauthimg,
      isAuthedCreator: d.isauthedcreator,
      snsId: d.snsid,
      snsName: d.snsname,
      snsChannel: d.snschannel,
      followerNumber: d.followernumber,
      mainContents: d.maincontents,
      introduce: d.introduce,
      bank: d.bank,
      account: d.account,
      accountName: d.accountname,
      point: d.point,
      createdAt: new Date(d.createdat),
      deletedAt: d.deletedat ? new Date(d.deletedat) : null,
    };
  };

  /** 엘라스틱서치에서 조회 */
  async searchInES(word: string, esIndex: string, page: number, size: number) {
    let fields = null;
    if (esIndex === ES_IDX_TYPE.CREATOR_IDX) {
      fields = ['nickname', 'snsname'];
    } else {
      // PRODUCT_IDX
      fields = ['name', 'user_snsname'];
    }

    let esResults = null;
    esResults = await this.elasticsearchService.search({
      index: esIndex,
      sort: ['_score', 'updatedat'],
      query: {
        multi_match: {
          query: word,
          fields: fields,
        },
      },
      from: page ? (page - 1) * size : 0,
      size: size ? size : 1000,
    });

    esResults = esResults?.hits?.hits?.map((el) => {
      let rst = null;
      const d = el._source;

      if (esIndex === ES_IDX_TYPE.CREATOR_IDX) {
        rst = this.getCreator(el);
      } else {
        // PRODUCT_IDX
        rst = {
          id: d.id,
          name: d.name,
          originPrice: d.originprice,
          quantity: d.quantity,
          originalquantity: d.originalQuantity,
          discountRate: d.discountrate,
          discountPrice: d.discountprice,
          isSoldout: d.issoldout,
          delivery: d.delivery,
          endType: d.endtype,
          validFrom: d.validfrom ? new Date(d.validfrom) : null,
          validUntil: d.validuntil ? new Date(d.validuntil) : null,
          images: d.images?.split(','),
          // detailImages: d.detailimages,
          // content: d.content,
          option1: d.option1,
          option2: d.option2,
          option3: d.option3,
          option4: d.option4,
          option5: d.option5,
          youtubeLink: d.youtubelink,
          shopName: d.shopname,
          ceo: d.ceo,
          brn: d.brn,
          mobn: d.mobn,
          user: {
            id: d.user_id,
            email: d.user_email,
            userType: d.user_type,
            nickname: d.user_nickname,
            phoneNumber: d.user_phonenumber,
            zipcode: d.user_zipcode,
            address: d.user_address,
            addressDetail: d.user_addressdeatil,
            profileImg: d.user_profileimg,
            creatorAuthImg: d.user_creatorAuthImg,
            isAuthedCreator: d.user_isauthedcreator,
            snsId: d.user_snsid,
            snsName: d.user_snsname,
            snsChannel: d.snschannel,
            followerNumber: d.user_follwernumber,
            mainContents: d.user_maincontents,
            introduce: d.user_introduce,
            bank: d.user_bank,
            account: d.user_account,
            accountName: d.user_accountname,
            point: d.user_point,
            createdAt: d.user_createdat,
            updatedAt: d.user_updatedat,
            deletedAt: d.user_deletedat,
          },
          skin: d.skin,
          textColor: d.textcolor,
          bgColor: d.bgColor,
          createdAt: new Date(d.createdat),
          deletedAt: d.deletedat ? new Date(d.deletedat) : null,
          updatedAt: new Date(d.product_updatedat * 1000), // unix_timestamp to Date()
        };
      }

      return rst;
    });

    if (!esResults || esResults.length === 0) esResults = null;
    console.log(
      'ES: searchInES:',
      `${esIndex} ` + JSON.stringify(esResults, null, ' '),
    );

    return esResults;
  }
}
