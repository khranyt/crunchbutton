<?php

class Controller_drivers_shift extends Crunchbutton_Controller_Account {
	
	public function init() {

		c::view()->page = 'drivers';

		switch ( c::getPagePiece( 2 ) ) {
			case 'community':
				
				switch ( c::getPagePiece( 3 ) ) {
					case 'add':
						$this->communityAdd();
						break;
					case 'edit':
						$this->communityEdit();
						break;
					default:
						$this->community();
						break;
				}
				break;
			
			case 'schedule':
				switch ( c::getPagePiece( 3 ) ) {
					case 'driver':
						$this->scheduleDriver();
					break;
					default:
					break;
				}
				break;

			default:
				
				break;
		}
	}

	public function scheduleDriver(){
		$admin = Admin::o( c::admin()->id_admin );
		$year = date( 'Y' );
		$week = date( 'W' );
		
		// Start week at monday #2666
		$firstDay = new DateTime( date( 'Y-m-d', strtotime( $year . 'W' . $week . 1 ) ), new DateTimeZone( c::config()->timezone  ) );

		// Get next week
		$firstDay->modify( '+ 1 week' );

		$days = [];
		for( $i = 0; $i <= 6; $i++ ){
			$days[] = new DateTime( $firstDay->format( 'Y-m-d' ), new DateTimeZone( c::config()->timezone  ) );
			$firstDay->modify( '+ 1 day' );
		}
		c::view()->days = $days;		
		c::view()->from = $days[ 0 ]->format( 'Y-m-d' );
		c::view()->to = $days[ 6 ]->format( 'Y-m-d' );
		c::view()->communities = $admin->communitiesHeDeliveriesFor();
		c::view()->display( 'drivers/shift/schedule/driver' );
	}

	public function communityEdit(){
		$id_community_shift = c::getPagePiece( 4 );
		$shift = Crunchbutton_Community_Shift::o( $id_community_shift );
		if( $shift->id_community_shift ){
			c::view()->layout( 'layout/ajax' );
			c::view()->shift = $shift;
			c::view()->display( 'drivers/shift/community/edit' );
		}
	}

	public function communityAdd(){
		$id_community = c::getPagePiece( 4 );
		$year = c::getPagePiece( 5 ) ? c::getPagePiece( 5 ) : date( 'Y' );
		$month = c::getPagePiece( 6 ) ? c::getPagePiece( 6 ) : date( 'm' );
		$day = c::getPagePiece( 7 ) ? c::getPagePiece( 7 ) : date( 'd' );
		$week = c::getPagePiece( 8 ) ? c::getPagePiece( 8 ) : date( 'W' );

		// Start week at monday #2666
		$firstDay = new DateTime( date( 'Y-m-d', strtotime( $year . 'W' . $week . 1 ) ), new DateTimeZone( c::config()->timezone  ) );

		$days = [];
		for( $i = 0; $i <= 6; $i++ ){
			$days[] = new DateTime( $firstDay->format( 'Y-m-d' ), new DateTimeZone( c::config()->timezone  ) );
			$firstDay->modify( '+ 1 day' );
		}

		if( $id_community ){
			c::view()->year = $year;
			c::view()->month = $month;
			c::view()->day = $day;
			c::view()->days = $days;
			c::view()->community = Crunchbutton_Community::o( $id_community );
			c::view()->layout( 'layout/ajax' );
			c::view()->display( 'drivers/shift/community/add' );
		}
	}

	public function community(){
		
		$id_community = c::getPagePiece( 3 );

		if( $id_community ){

			$year = c::getPagePiece( 4 ) ? c::getPagePiece( 4 ) : date( 'Y' ) ;
			$week = c::getPagePiece( 5 ) ? c::getPagePiece( 5 ) : date( 'W' ) ;

			if( intval( $week ) < 10 ){
				$week = '0' . intval( $week );
			}

			// Start week at monday #2666
			$firstDay = new DateTime( date( 'Y-m-d', strtotime( $year . 'W' . $week . 1 ) ), new DateTimeZone( c::config()->timezone  ) );

			$days = [];
			for( $i = 0; $i <= 6; $i++ ){
				$days[] = new DateTime( $firstDay->format( 'Y-m-d' ), new DateTimeZone( c::config()->timezone  ) );
				$firstDay->modify( '+ 1 day' );
			}

			if( $week <= 1 ){
				$weekPrev = ( $year - 1 ) . '/52';
			} else {
				$weekPrev = ( $year ) . '/' . ( $week - 1 );
			}
			if( $week >= 52 ){
				$weekNext = ( $year + 1 ) . '/01';
			} else {
				$weekNext = ( $year ) . '/' . ( $week + 1 );
			}

			c::view()->weekPrev = $weekPrev;
			c::view()->weekNext = $weekNext;
			c::view()->week = $week;
			c::view()->year = $year;
			c::view()->days = $days;
			$firstDay->modify( '-1 day' );
			c::view()->to = new DateTime( $firstDay->format( 'Y-m-d' ), new DateTimeZone( c::config()->timezone  ) );
			$firstDay->modify( '-6 day' );
			c::view()->from = new DateTime( $firstDay->format( 'Y-m-d' ), new DateTimeZone( c::config()->timezone  ) );
		}
		c::view()->id_community = $id_community;
		c::view()->display( 'drivers/shift/community/index' );
	}
}