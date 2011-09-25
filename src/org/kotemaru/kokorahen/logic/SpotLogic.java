package org.kotemaru.kokorahen.logic;

import java.util.*;
import java.util.logging.Logger;
import org.slim3.datastore.*;
import org.kotemaru.jsrpc.Params;
import org.kotemaru.kokorahen.jsrpc.Kokorahen;
import org.kotemaru.kokorahen.meta.SpotModelMeta;
import org.kotemaru.kokorahen.meta.UserModelMeta;
import org.kotemaru.kokorahen.model.SpotModel;
import org.kotemaru.kokorahen.model.UserModel;

import twitter4j.TwitterException;

import com.google.appengine.api.datastore.Key;


public class SpotLogic  {
	private static final long serialVersionUID = 1L;
	private static final Logger LOG = Logger.getLogger(SpotLogic.class.getName());

	private Kokorahen env;
	
	private SpotLogic(Kokorahen env) {
		this.env = env;
	}
	
	public static SpotLogic getInstance(Kokorahen env) {
		return new SpotLogic(env);
	}
	
	public SpotModel getSpot(Long id){
		if (id == null) return null;
		try {
			Key key = Datastore.createKey(SpotModel.class, id);
			SpotModel model = Datastore.get(SpotModel.class, key);
			return model;
		} catch (EntityNotFoundRuntimeException e) {
			return null;
		}
	}
	
	public  Long writeSpot(Map map) {
		Params params = new Params(map);

		Long id = params.toLong("id");
		SpotModel model = getSpot(id);
		if (id == null) {
			model = new SpotModel();
		}

		model.setName(params.toString("name"));
		model.setFurikana(params.toString("furikana"));
		model.setCreateDate(new Date());
		model.setUpdateDate(new Date());
		model.setLat(params.toDouble("lat"));
		model.setLng(params.toDouble("lng"));
		model.setAreas(toAreaList(model.getLat(), model.getLng()));
		model.setAddress(params.toString("address"));
		model.setTags((List<String>)map.get("tags"));
		model.setImage(params.toString("image"));
		model.setComment(params.toString("comment"));
		model.setClosedDay(params.toString("closedDay"));
		model.setTimeLunchMin(params.toString("timeLunchMin"));
		model.setTimeLunchMax(params.toString("timeLunchMax"));
		model.setTimeDinnerMin(params.toString("timeDinnerMin"));
		model.setTimeDinnerMax(params.toString("timeDinnerMax"));
		model.setEmail(params.toString("email"));
		model.setUrl(params.toString("url"));

		// for Dummy data
		Float appraise = params.toFloat("appraise");
		if (appraise != null) {
			model.setAppraise(appraise);
		}
		
		Key key = Datastore.put(model);
		return key.getId();
	}


	public static List<String> toAreaList(double lat, double lng) {
		// 100K
		int lat0 = (int)Math.floor(lat);
		int lng0 = (int)Math.floor(lng);
		// 10K
		double lat1 = Math.floor(lat*10)/10;
		double lng1 = Math.floor(lng*10)/10;
		// 1K
		double lat2 = Math.floor(lat*100)/100;
		double lng2 = Math.floor(lng*100)/100;
		// 100m
		double lat3 = Math.floor(lat*1000)/1000;
		double lng3 = Math.floor(lng*1000)/1000;
		// 10m
		double lat4 = Math.floor(lat*10000)/10000;
		double lng4 = Math.floor(lng*10000)/10000;
		
		List<String> list = Arrays.asList(
			String.format("%03d,%03d", lat0, lng0),
			String.format("%05.1f,%05.1f", lat1, lng1),
			String.format("%06.2f,%06.2f", lat2, lng2),
			String.format("%07.3f,%07.3f", lat3, lng3),
			String.format("%08.4f,%08.4f", lat4, lng4)
		);
		return list;
	}

	public static String toArea(double lat, double lng) {
		// 1K
		double lat2 = Math.floor(lat*100)/100;
		double lng2 = Math.floor(lng*100)/100;
		return String.format("%06.2f,%06.2f", lat2, lng2);
	}
	
	public List<SpotModel> listSpot(Map map){
		Params params = new Params(map);
		double latMin =  params.toDouble("latMin");
		double lngMin =  params.toDouble("lngMin");
		double latMax =  params.toDouble("latMax");
		double lngMax =  params.toDouble("lngMax");
		Integer limit = params.toInteger("limit");
		List<String> areas = (List<String>) params.get("areas");
		String tag = params.toString("tag");

		SpotModelMeta e = SpotModelMeta.get();
		Iterator<SpotModel>[] qs = new Iterator[areas.size()];
		for (int i=0; i<qs.length; i++) {
			ModelQuery q = Datastore.query(e);
			q.filter(e.areas.in(areas.get(i)));
			q.sort(e.appraise.desc);
			if (tag != null) q.filter(e.tags.in(tag));
			qs[i] = q.asIterator();
		}
		
		SpotModel[] spots = new SpotModel[qs.length];
		for (int i=0; i<qs.length; i++) {
			while (spots[i] == null && qs[i].hasNext()) {
				spots[i] = qs[i].next();
				if (!inBounds(spots[i],latMin,lngMin,latMax,lngMax)) {
					spots[i] = null;
				}
			}
		}

		List<SpotModel> list = new ArrayList<SpotModel>(limit);
		for (int i=0; i<limit; i++) {
			int maxJ = -1;
			float maxA = -10000.0F;
			for (int j=0; j<spots.length; j++) {
				if (spots[j] != null && spots[j].getAppraise() > maxA) {
					maxJ = j;
					maxA = spots[j].getAppraise();
				}
			}
			if (maxJ == -1) break;
			list.add(spots[maxJ]);
			spots[maxJ] = null;
			while (spots[maxJ] == null && qs[maxJ].hasNext()) {
				spots[maxJ] = qs[maxJ].next();
				if (!inBounds(spots[maxJ],latMin,lngMin,latMax,lngMax)) {
					spots[maxJ] = null;
				}
			}
		}
		
		System.out.println("spots="+list.size()+"\n"+params);

		return list;
	}
	private boolean inBounds(SpotModel spot, double latMin, double lngMin,
			double latMax, double lngMax) {
		double lat = spot.getLat();
		double lng = spot.getLng();
		return latMin<=lat && lat<=latMax && lngMin<=lng && lng<=lngMax;
	}
/*
	public  List<AreaSpotBean> listSpot(Map map){
		Params params = new Params(map);
		//String area = params.toString("area");
		List<String> areas = (List<String>) params.get("areas");
		String tag = params.toString("tag");
		Integer limit = params.toInteger("limit");
		Integer range = params.toInteger("range");

		List<AreaSpotBean> result = new ArrayList<AreaSpotBean>(areas.size());
		SpotModelMeta e = SpotModelMeta.get();
		for (String area : areas) {
			if (area == null) continue; // ignore null.

			ModelQuery q = Datastore.query(e);
			q.filter(e.areas.in(area));
			q.sort(e.appraise.desc);
			if (tag != null) q.filter(e.tags.in(tag));
			if (limit != null) q.limit(limit);
			List<SpotModel> list = q.asList();

			result.add(new AreaSpotBean(area, list));
		}

		System.out.println("listSpot:"+areas);
		return result;
	}
*/
	
}
