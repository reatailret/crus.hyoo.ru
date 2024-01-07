namespace $ {
	
	export class $hyoo_crus_pack extends $mol_buffer {
		
		toBlob() {
			return new Blob( [ this ], { type: 'application/x-crus-pack' } )
		}
		
		parts() {
			
			const faces = {} as Record< symbol, $hyoo_crus_face >
			const units = {} as Record< symbol, $hyoo_crus_unit[] >
			const rocks = [] as [ Uint8Array, null | Uint8Array ][]
			
			const buff = this.asArray()
			let land = null as symbol | null
			
			for( let offset = 0; offset < this.byteLength; ) {
				
				const kind = this.uint8( offset )
				if( kind % 2 ) {
					
					switch( kind ) {
						
						case $hyoo_crus_part.land: {
							
							if( !$mol_compare_deep( $hyoo_crus_part_crus, buff.slice( offset, offset += 4 ) ) ) {
								$mol_fail( new Error( 'Wrong 4CC code' ) )
							}
							
							land = Symbol.for( $mol_base64_ae_encode( buff.slice( offset, offset += 18 ) ) )
							offset += 2
							
							continue
						}
						
						case $hyoo_crus_part.face: {
							
							if( !land ) $mol_fail( new Error( 'Land is undefined' ) )
							
							const peer = $mol_base64_ae_encode( buff.slice( offset += 4, offset += 6 ) )
							const time = this.uint48( offset += 6 )
							
							faces[ land ] ||= new $hyoo_crus_face
							faces[ land ].see_peer( peer, time )
							
							continue
						}
						
						case $hyoo_crus_part.pass: {
							
							if( !land ) $mol_fail( new Error( 'Land is undefined' ) )
							
							const unit = new $hyoo_crus_pass( buff.slice( offset, offset += $hyoo_crus_unit.size ).buffer )
							
							units[ land ] ||= []
							units[ land ].push( unit )
							
							continue
						}
						
						case $hyoo_crus_part.gift: {
							
							if( !land ) $mol_fail( new Error( 'Land is undefined' ) )
							
							const unit = new $hyoo_crus_gift( buff.slice( offset, offset += $hyoo_crus_unit.size ).buffer )
							
							units[ land ] ||= []
							units[ land ].push( unit )
							
							continue
						}
						
						case $hyoo_crus_part.hash: {
							
							const hash = buff.slice( offset += 4, offset += 20 )
							rocks.push([ hash, null ])
							
							continue
						}
						
						case $hyoo_crus_part.rock: {
							
							const size = this.uint32( offset ) >> 8
							const hash = buff.slice( offset += 4, offset += 20 )
							const rock = buff.slice( offset, offset += size )
							rocks.push([ hash, rock ])
							
							continue
						}
						
						case $hyoo_crus_part.buck: continue
						
						default: $$.$mol_log3_warn({
							place: '$hyoo_crus_pack..parts()',
							message: `Unknown CRUS Pack Part (${ kind.toString(2) })`,
							hint: `Try to update app`
						})
						
					}
					
				} else {
					
					if( !land ) $mol_fail( new Error( 'Land is undefined' ) )
					
					units[ land ] ||= []
					units[ land ].push( new $hyoo_crus_gist( buff.slice( offset, offset += $hyoo_crus_unit.size ).buffer ) )
					
					continue
				}
				
			}
			
			return { faces, units, rocks }
			
		}
	
		static make(
			faces: Record< symbol, $hyoo_crus_face >,
			units: Record< symbol, readonly $hyoo_crus_unit[] >,
			rocks: readonly [ Uint8Array, null | Uint8Array ][],
		) {
			
			let size = 0
			
			for( const land of Reflect.ownKeys( faces ) as symbol[] ) {
				size += 24 + faces[ land ].size * 16
			}
			
			for( const land of Reflect.ownKeys( units ) as symbol[] ) {
				size += 24 + units[ land ].length * $hyoo_crus_unit.size
			}
			
			for( const [ hash, rock ] of rocks ) {
				size += 24 + ( rock?.length ?? 0 )
			}
			
			if( size === 0 ) return null!
			
			const buff = new Uint8Array( size )
			const pack = new $hyoo_crus_pack( buff.buffer )
			
			let offset = 0
			
			const open_land = ( land: symbol )=> {
				buff.set( $hyoo_crus_part_crus, offset )
				buff.set( $mol_base64_ae_decode( land.description!.padEnd( 24, 'A' ) ), offset + 4 )
				offset += 24
			}
			
			for( const land of Reflect.ownKeys( faces ) as symbol[] ) {
				
				open_land( land )
				
				for( const [ peer, time ] of faces[ land ] ) {
					pack.uint32( offset, $hyoo_crus_part.face )
					buff.set( $mol_base64_ae_decode( peer ), offset + 4 )
					pack.uint48( offset + 10, time )
					offset += 16
				}
				
			}
			
			for( const land of Reflect.ownKeys( units ) as symbol[] ) {
				
				open_land( land )
				
				for( const unit of units[ land ] ) {
					buff.set( unit.asArray(), offset )
					offset += unit.byteLength
				}
				
			}
			
			for( const [ hash, rock ] of rocks ) {
				const len = rock?.length ?? 0
				pack.uint32( offset, len ? ( len << 8 ) + $hyoo_crus_part.hash : $hyoo_crus_part.rock )
				buff.set( hash, offset + 4 )
				if( rock ) buff.set( rock, offset + 24 )
				offset += 24 + len
			}
			
			return pack
		}
		
	}
	
	
	
}
